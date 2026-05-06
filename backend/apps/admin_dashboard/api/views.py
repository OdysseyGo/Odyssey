import json
import logging
import os
import uuid

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Avg, Count, Q
from django.http import HttpResponse
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.generics import CreateAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ViewSet

from apps.admin_dashboard.api.filters import (
    AdminTourFilter,
    AdminUserFilter,
    ReportFilter,
)
from apps.admin_dashboard.api.pagination import AdminPagination
from apps.admin_dashboard.api.permissions import IsStaffUser
from apps.admin_dashboard.api.serializers import (
    AdminARModelSerializer,
    AdminTourDetailSerializer,
    AdminTourListSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    BadgeVisualBundleSerializer,
    BadgeVisualOverrideSerializer,
    BadgeVisualTemplateSerializer,
    BanRecordSerializer,
    BanUserSerializer,
    BulkUserActionSerializer,
    DashboardSummarySerializer,
    GameBadgeVisualTypeSerializer,
    PictureCompareConfigSerializer,
    PictureCompareTuningSerializer,
    ReportActionSerializer,
    ReportCreateSerializer,
    ReportSerializer,
    TimeSeriesPointSerializer,
    TopTourSerializer,
    UserRuntimeConfigSerializer,
)
from apps.admin_dashboard.models import BanRecord, Report
from apps.admin_dashboard.services.analytics import AnalyticsService
from apps.gamification.models import (
    Badge,
    PictureCompareConfig,
    TourProgress,
)
from apps.gamification.picture_compare import compare_picture_similarity
from apps.gamification.services import BadgeService
from apps.gamification.visuals import (
    FlagBadgeVisualService,
    GameBadgeVisualService,
    derive_game_type_key_from_badge_code,
)
from apps.notifications.utils import create_notification
from apps.tours.models import ARModel, Review, Tour
from apps.tours.utils import GoogleMapsFacade
from apps.users.models import User, UserRuntimeConfig

logger = logging.getLogger(__name__)

# ── User Management ──────────────────────────────────────────────────

try:
    from storages.backends.s3boto3 import S3Boto3Storage
except Exception:  # pragma: no cover - optional import safety
    S3Boto3Storage = None


class AdminUserViewSet(ModelViewSet):
    permission_classes = [IsStaffUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AdminUserFilter
    search_fields = ["username", "email"]
    ordering_fields = ["date_joined", "username", "xp", "level"]
    ordering = ["-date_joined"]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        qs = User.objects.all()
        if self.action == "retrieve":
            qs = qs.annotate(
                badges_earned_count=Count("badges", distinct=True),
                tours_created_count=Count("created_tours", distinct=True),
                tours_completed_count=Count(
                    "tour_progress",
                    filter=Q(tour_progress__status=TourProgress.COMPLETED),
                    distinct=True,
                ),
                reviews_count=Count("reviews", distinct=True),
            )
        return qs

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AdminUserDetailSerializer
        if self.action in ("partial_update", "update"):
            return AdminUserUpdateSerializer
        if self.action == "ban":
            return BanUserSerializer
        if self.action == "bulk_action":
            return BulkUserActionSerializer
        return AdminUserListSerializer

    @action(detail=True, methods=["post"], url_path="ban")
    def ban(self, request, pk=None):
        user = self.get_object()
        serializer = BanUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            ban = BanRecord.objects.create(
                user=user,
                banned_by=request.user,
                reason=serializer.validated_data["reason"],
                expires_at=serializer.validated_data.get("expires_at"),
            )
            user.is_banned = True
            user.save(update_fields=["is_banned"])

        return Response(BanRecordSerializer(ban).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="unban")
    def unban(self, request, pk=None):
        user = self.get_object()

        with transaction.atomic():
            active_bans = BanRecord.objects.filter(user=user, is_active=True)
            active_bans.update(
                is_active=False,
                unbanned_at=timezone.now(),
                unbanned_by=request.user,
            )
            user.is_banned = False
            user.save(update_fields=["is_banned"])

        return Response({"detail": "User unbanned."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="bulk-action")
    def bulk_action(self, request):
        serializer = BulkUserActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        user_ids = data["user_ids"]
        action_type = data["action"]
        users = User.objects.filter(id__in=user_ids)

        if users.count() != len(user_ids):
            found_ids = set(users.values_list("id", flat=True))
            missing = set(user_ids) - found_ids
            return Response(
                {"detail": f"Users not found: {missing}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if action_type == BulkUserActionSerializer.BAN:
                for user in users:
                    BanRecord.objects.create(
                        user=user,
                        banned_by=request.user,
                        reason=data.get("reason", "Bulk ban"),
                    )
                users.update(is_banned=True)

            elif action_type == BulkUserActionSerializer.UNBAN:
                BanRecord.objects.filter(user__in=users, is_active=True).update(
                    is_active=False,
                    unbanned_at=timezone.now(),
                    unbanned_by=request.user,
                )
                users.update(is_banned=False)

            elif action_type == BulkUserActionSerializer.CHANGE_ROLE:
                users.update(user_type=data["role"])

        return Response(
            {"detail": f"Action '{action_type}' applied to {len(user_ids)} users."},
            status=status.HTTP_200_OK,
        )


# ── Tour Management ──────────────────────────────────────────────────


class AdminTourViewSet(ModelViewSet):
    permission_classes = [IsStaffUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = AdminTourFilter
    search_fields = ["title", "description", "category", "city", "country"]
    ordering_fields = ["created_at", "title", "avg_rating", "completion_count"]
    ordering = ["-created_at"]
    http_method_names = ["get", "delete", "post", "head", "options"]

    def get_queryset(self):
        return Tour.objects.select_related("creator").annotate(
            avg_rating=Avg("reviews__rating"),
            completion_count=Count(
                "progress",
                filter=Q(progress__status=TourProgress.COMPLETED),
                distinct=True,
            ),
            review_count=Count("reviews", distinct=True),
            step_count=Count("steps", distinct=True),
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return AdminTourDetailSerializer
        return AdminTourListSerializer

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        tour = self.get_object()

        if tour.submission_type == Tour.DELETE:
            tour_id = tour.id
            tour_title = tour.title
            tour.delete()
            return Response(
                {"detail": f'Tour "{tour_title}" (#{tour_id}) approved for deletion.'}
            )

        if not tour.city or not tour.country:
            return Response(
                {"location": "City and Country are required before publishing a tour."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not tour.steps.exists():
            return Response(
                {"steps": "At least one tour stop is required before publishing."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        facade = GoogleMapsFacade()

        city_lat, city_lon = facade.geocode_location(
            name=tour.city, city=tour.city, fallback_lat=0.0, fallback_lng=0.0
        )

        has_step_in_city = facade.tour_has_step_in_city(
            tour, city_latitude=city_lat, city_longitude=city_lon
        )

        if not has_step_in_city:
            return Response(
                {"city": "At least one tour stop must be inside the selected city."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tour.status = Tour.PUBLISHED
        tour.review_status = None
        tour.submission_type = Tour.CREATE
        tour.save(
            update_fields=["status", "review_status", "submission_type", "updated_at"]
        )

        try:
            send_mail(
                subject=f'Your tour "{tour.title}" has been published! 🎉',
                message=(
                    f"Hi {tour.creator.username},\n\n"
                    f'Great news! Your tour "{tour.title}" has been reviewed and is now live on Odyssey.\n\n'
                    "Explorers can now discover and start your tour. Thank you for your contribution!\n\n"
                    "— The Odyssey Team"
                ),
                from_email=None,
                recipient_list=[tour.creator.email],
            )
        except Exception as e:
            logger.error("Failed to send approval email for tour %s: %s", tour.id, e)

        return Response({"detail": "Tour approved and published."})

        create_notification(
            user=tour.creator,
            title="Your tour has been approved!",
            body=f"Congratulations, your tour named '{tour.title}' was published .",
            data={"tour_id": tour.id, "type": "tour_approved"},
        )

        for follow_obj in tour.creator.followers.select_related("follower").all():
            create_notification(
                user=follow_obj.follower,
                title="New Adventure!",
                body=f"One of your followed user '{tour.creator.username}' published a new tour in {tour.state}.",
                data={"tour_id": tour.id, "type": "new_tour"},
            )

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        tour = self.get_object()
        reason = request.data.get("reason", "").strip()
        if tour.submission_type == Tour.DELETE:
            tour.status = Tour.PUBLISHED
            tour.review_status = None
            tour.submission_type = Tour.CREATE
            tour.save(
                update_fields=[
                    "status",
                    "review_status",
                    "submission_type",
                    "updated_at",
                ]
            )
            return Response(
                {"detail": "Delete request rejected and tour restored to published."}
            )

        tour.status = Tour.PENDING
        tour.review_status = Tour.REJECTED
        tour.save(update_fields=["status", "review_status", "updated_at"])

        try:
            reason_block = f'\nReason from our team:\n"{reason}"\n' if reason else ""
            send_mail(
                subject=f'Update on your tour "{tour.title}"',
                message=(
                    f"Hi {tour.creator.username},\n\n"
                    f'After review, your tour "{tour.title}" was not approved at this time '
                    f"and is now marked as pending (rejected).{reason_block}\n"
                    "Please make the necessary changes and update the tour to send it back for review.\n\n"
                    "— The Odyssey Team"
                ),
                from_email=None,
                recipient_list=[tour.creator.email],
            )
        except Exception as e:
            logger.error("Failed to send rejection email for tour %s: %s", tour.id, e)

        return Response({"detail": "Tour rejected and marked as pending (rejected)."})

    @action(detail=True, methods=["post"], url_path="archive")
    def archive(self, request, pk=None):
        tour = self.get_object()
        tour.status = Tour.ARCHIVED
        tour.save(update_fields=["status"])
        return Response({"detail": "Tour archived."})

    @action(detail=True, methods=["get"], url_path="analytics")
    def analytics(self, request, pk=None):
        tour = self.get_object()
        data = {
            "tour_id": tour.id,
            "title": tour.title,
            "avg_rating": tour.avg_rating,
            "completion_count": tour.completion_count,
            "review_count": tour.review_count,
            "step_count": tour.step_count,
        }
        return Response(data)


class AdminARModelViewSet(ModelViewSet):
    permission_classes = [IsStaffUser]
    serializer_class = AdminARModelSerializer
    queryset = ARModel.objects.all().order_by("sort_order", "id")
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "slug"]
    ordering_fields = ["updated_at", "created_at", "name", "sort_order"]
    ordering = ["sort_order", "id"]


# ── Analytics ────────────────────────────────────────────────────────


class AnalyticsViewSet(ViewSet):
    permission_classes = [IsStaffUser]

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        data = AnalyticsService.get_dashboard_summary()
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="user-growth")
    def user_growth(self, request):
        period = request.query_params.get("period", "daily")
        days = int(request.query_params.get("days", 30))
        data = AnalyticsService.get_user_growth(period=period, days=days)
        serializer = TimeSeriesPointSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="tour-growth")
    def tour_growth(self, request):
        period = request.query_params.get("period", "daily")
        days = int(request.query_params.get("days", 30))
        data = AnalyticsService.get_tour_growth(period=period, days=days)
        serializer = TimeSeriesPointSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="top-tours")
    def top_tours(self, request):
        order_by = request.query_params.get("order_by", "rating")
        limit = int(request.query_params.get("limit", 10))
        data = AnalyticsService.get_top_tours(order_by=order_by, limit=limit)
        serializer = TopTourSerializer(data, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="distributions")
    def distributions(self, request):
        data = AnalyticsService.get_distributions()
        return Response(data)

    @action(detail=False, methods=["get"], url_path="active-users")
    def active_users(self, request):
        days = int(request.query_params.get("days", 7))
        count = AnalyticsService.get_active_users(days=days)
        return Response({"days": days, "active_users": count})


# ── Picture Compare Tuning ───────────────────────────────────────────


class PictureCompareTuningViewSet(ViewSet):
    permission_classes = [IsStaffUser]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request):
        serializer = PictureCompareTuningSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = compare_picture_similarity(
            reference_image_file=data["reference_image"],
            attempt_image_file=data["attempt_image"],
            threshold=data["threshold"],
            tuning_config=serializer.tuning_config(),
            include_breakdown=True,
        )
        result["threshold"] = data["threshold"]
        return Response(result)


class PictureCompareConfigViewSet(ViewSet):
    permission_classes = [IsStaffUser]

    def list(self, request):
        serializer = PictureCompareConfigSerializer(PictureCompareConfig.load())
        return Response(serializer.data)

    def create(self, request):
        config = PictureCompareConfig.load()
        serializer = PictureCompareConfigSerializer(
            config,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UserRuntimeConfigViewSet(ViewSet):
    permission_classes = [IsStaffUser]

    def list(self, request):
        serializer = UserRuntimeConfigSerializer(UserRuntimeConfig.load())
        return Response(serializer.data)

    def create(self, request):
        config = UserRuntimeConfig.load()
        serializer = UserRuntimeConfigSerializer(
            config,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        default_reviewer_before = config.default_reviewer
        serializer.save()

        users_updated = 0
        if not default_reviewer_before and serializer.instance.default_reviewer:
            users_updated = User.objects.filter(is_review_account=False).update(
                is_review_account=True
            )

        response_data = serializer.data.copy()
        response_data["users_updated"] = users_updated
        return Response(response_data)


class BadgeVisualViewSet(ViewSet):
    permission_classes = [IsStaffUser]

    @staticmethod
    def _s3_configured() -> bool:
        return bool(
            getattr(settings, "AWS_STORAGE_BUCKET_NAME", "")
            and getattr(settings, "AWS_ACCESS_KEY_ID", "")
            and getattr(settings, "AWS_SECRET_ACCESS_KEY", "")
        )

    @classmethod
    def _image_storage(cls):
        if cls._s3_configured() and S3Boto3Storage is not None:
            return S3Boto3Storage()
        return default_storage

    @staticmethod
    def _badge_code_id_maps():
        code_to_id = {}
        id_to_code = {}
        for badge in Badge.objects.all().values("id", "code"):
            badge_code = (badge.get("code") or "").strip().upper()
            badge_id = badge.get("id")
            if badge_code:
                code_to_id[badge_code] = badge_id
                id_to_code[badge_id] = badge_code
        return code_to_id, id_to_code

    @classmethod
    def _serialize_override(cls, item):
        code_to_id, _ = cls._badge_code_id_maps()
        badge_code = (item.get("badge_code") or "").strip().upper()
        return {
            "id": int(item.get("id", 0)),
            "badge": code_to_id.get(badge_code),
            "badge_code": badge_code,
            "country_code": (item.get("country_code") or "").strip().upper(),
            "config": item.get("config") or {},
            "updated_at": "",
        }

    def list(self, request):
        # Legacy route behaves as flag bundle for backward compatibility.
        return self.flag_bundle(request)

    @action(detail=False, methods=["get"], url_path="flag")
    def flag_bundle(self, request):
        BadgeService.ensure_default_badges()
        payload = FlagBadgeVisualService.read_payload()
        city_codes = list(
            Badge.objects.filter(code__startswith="CITY_").values_list(
                "code", flat=True
            )
        )
        payload = {
            "template": payload.get("template")
            or FlagBadgeVisualService.load_template(),
            "overrides": [
                self._serialize_override(item)
                for item in (payload.get("overrides") or [])
            ],
        }
        serializer = BadgeVisualBundleSerializer(
            payload, context={"badge_codes": city_codes}
        )
        return Response(serializer.data)

    @action(detail=False, methods=["post"], url_path="template")
    def update_template(self, request):
        return self.update_flag_template(request)

    @action(detail=False, methods=["post"], url_path="flag/template")
    def update_flag_template(self, request):
        serializer = BadgeVisualTemplateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = FlagBadgeVisualService.save_template(
            serializer.validated_data.get("config") or {}
        )
        return Response(
            {
                "config": saved.get("template")
                or FlagBadgeVisualService.load_template(),
                "updated_at": timezone.now().isoformat(),
            }
        )

    @action(detail=False, methods=["post"], url_path="overrides")
    def upsert_override(self, request):
        return self.upsert_flag_override(request)

    @action(detail=False, methods=["post"], url_path="flag/overrides")
    def upsert_flag_override(self, request):
        serializer = BadgeVisualOverrideSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        _, id_to_code = self._badge_code_id_maps()
        badge_id = data.get("badge")
        badge_code = (
            (id_to_code.get(badge_id) if badge_id else None)
            or data.get("badge_code")
            or ""
        )
        _, saved = FlagBadgeVisualService.upsert_override(
            badge_code=badge_code,
            country_code=data.get("country_code", ""),
            config=data.get("config", {}),
        )
        return Response(self._serialize_override(saved))

    @action(
        detail=False, methods=["delete"], url_path=r"overrides/(?P<override_id>\d+)"
    )
    def delete_override(self, request, override_id=None):
        return self.delete_flag_override(request, override_id=override_id)

    @action(
        detail=False,
        methods=["delete"],
        url_path=r"flag/overrides/(?P<override_id>\d+)",
    )
    def delete_flag_override(self, request, override_id=None):
        deleted = FlagBadgeVisualService.delete_override(int(override_id))
        if not deleted:
            return Response(
                {"detail": "Override not found."}, status=status.HTTP_404_NOT_FOUND
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], url_path="game")
    def game_bundle(self, request):
        BadgeService.ensure_default_badges()
        badges = list(Badge.objects.exclude(code__startswith="CITY_").order_by("id"))

        grouped = {}
        for badge in badges:
            type_key = derive_game_type_key_from_badge_code(badge.code)
            if not type_key:
                continue
            grouped.setdefault(type_key, []).append(
                {
                    "id": badge.id,
                    "code": badge.code,
                    "name": badge.name,
                    "criteria": badge.criteria or {},
                }
            )

        items = []
        for type_key, badge_items in grouped.items():
            config = GameBadgeVisualService.ensure_type_config(type_key=type_key)
            items.append(
                {
                    "type_key": type_key,
                    "label": type_key.replace("_", " ").title(),
                    "badges": badge_items,
                    "config": config,
                }
            )

        return Response({"items": items})

    @action(detail=False, methods=["post"], url_path="game/config")
    def upsert_game_type_config(self, request):
        serializer = GameBadgeVisualTypeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        saved = GameBadgeVisualService.upsert_type_config(
            type_key=data["type_key"],
            layout=data["layout"],
            tiers=data["tiers"],
        )
        return Response(
            {
                "type_key": data["type_key"],
                "config": saved,
                "updated_at": timezone.now().isoformat(),
            }
        )

    @action(
        detail=False,
        methods=["post"],
        url_path="upload-image",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_image(self, request):
        image = request.FILES.get("image")
        if image is None:
            return Response(
                {"detail": "image file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not image.name.lower().endswith(".png"):
            return Response(
                {"detail": "Only .png files are supported."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = os.path.splitext(image.name or "")[1].lower() or ".png"
        path = f"badge_visual_assets/{uuid.uuid4().hex}{ext}"
        storage = self._image_storage()
        saved_path = storage.save(path, image)
        return Response({"url": storage.url(saved_path)})

    @action(detail=False, methods=["get"], url_path="export")
    def export(self, request):
        return self.export_flag(request)

    @action(detail=False, methods=["get"], url_path="flag/export")
    def export_flag(self, request):
        body = FlagBadgeVisualService.read_payload()
        response = HttpResponse(
            json.dumps(body, indent=2, sort_keys=True) + "\n",
            content_type="application/json",
        )
        response["Content-Disposition"] = 'attachment; filename="badge_visuals.json"'
        return response

    @action(detail=False, methods=["get"], url_path="game/export")
    def export_game(self, request):
        body = GameBadgeVisualService.read_payload()
        response = HttpResponse(
            json.dumps(body, indent=2, sort_keys=True) + "\n",
            content_type="application/json",
        )
        response["Content-Disposition"] = (
            'attachment; filename="badge_visuals_game.json"'
        )
        return response


# ── Content Moderation ───────────────────────────────────────────────


class ReportViewSet(ModelViewSet):
    permission_classes = [IsStaffUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ReportFilter
    ordering = ["-created_at"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Report.objects.select_related("reporter", "resolved_by")

    def get_serializer_class(self):
        if self.action == "take_action":
            return ReportActionSerializer
        return ReportSerializer

    @action(detail=True, methods=["post"], url_path="take-action")
    def take_action(self, request, pk=None):
        report = self.get_object()
        serializer = ReportActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        action_type = data["action"]
        admin_notes = data.get("admin_notes", "")

        with transaction.atomic():
            if action_type == ReportActionSerializer.REMOVE_CONTENT:
                self._remove_content(report)
                report.status = Report.RESOLVED

            elif action_type == ReportActionSerializer.BAN_USER:
                self._ban_reported_user(report, request.user, data)
                report.status = Report.RESOLVED

            elif action_type == ReportActionSerializer.DISMISS:
                report.status = Report.DISMISSED

            elif action_type == ReportActionSerializer.WARN:
                report.status = Report.REVIEWED

            report.admin_notes = admin_notes
            report.resolved_at = timezone.now()
            report.resolved_by = request.user
            report.save()

        return Response(ReportSerializer(report).data)

    def _remove_content(self, report):
        if report.content_type == Report.TOUR:
            Tour.objects.filter(id=report.content_id).update(status=Tour.ARCHIVED)
        elif report.content_type == Report.REVIEW:
            Review.objects.filter(id=report.content_id).delete()

    def _ban_reported_user(self, report, admin_user, data):
        if report.content_type == Report.USER:
            target_user = User.objects.get(id=report.content_id)
        elif report.content_type == Report.TOUR:
            tour = Tour.objects.select_related("creator").get(id=report.content_id)
            target_user = tour.creator
        elif report.content_type == Report.REVIEW:
            review = Review.objects.select_related("user").get(id=report.content_id)
            target_user = review.user
        else:
            return

        BanRecord.objects.create(
            user=target_user,
            banned_by=admin_user,
            reason=data.get("ban_reason", "Violation of terms"),
            expires_at=data.get("ban_expires_at"),
        )
        target_user.is_banned = True
        target_user.save(update_fields=["is_banned"])


# ── User-Facing Report Submission ────────────────────────────────────


class SubmitReportView(CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReportCreateSerializer

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)
