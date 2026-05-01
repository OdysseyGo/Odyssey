import logging
import secrets

from django.contrib.auth import authenticate  # login direkt
from django.core.mail import send_mail
from django.db.models import Avg, F, QuerySet  # F dbden çıkarmadan yazıyon
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import filters
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken  # login token

from apps.gamification.api.serializers import UserBadgeSerializer
from apps.gamification.models import TourProgress, UserBadge
from apps.gamification.services import BadgeService
from apps.tours.api.serializers import TourSerializer
from apps.tours.models import Tour
from apps.users.models import Follow, PasswordResetOTP, SearchHistory, User

from .serializers import (
    FollowingFeedSerializer,
    FollowSerializer,
    LoginResponseSerializer,
    LoginSerializer,
    SearchHistorySerializer,
    UserSerializer,
)
from .throttles import PasswordResetConfirmThrottle, PasswordResetRequestThrottle

logger = logging.getLogger(__name__)


class UserViewSet(ModelViewSet):
    queryset: QuerySet[User] = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["username", "first_name", "last_name"]

    @action(detail=False, methods=["get"], url_path="get-by-username")
    def get_by_username(self, request):
        username = request.query_params.get("username")
        if not username:
            return Response({"error": "username is required"}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        )

    @extend_schema(request=LoginSerializer, responses={200: LoginResponseSerializer})
    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({"detail": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)
        BadgeService.sync_login_streak(user)
        BadgeService.evaluate_user_badges(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                # "user": UserSerializer(user).data,
            }
        )

    @action(detail=False, methods=["post"], url_path="refresh-token")
    def refresh_token(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({"detail": "Refresh token missing"}, status=400)

        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)

            return Response({"access": new_access})
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=400)

    @action(
        detail=False,
        methods=["get"],
        url_path="me",
        permission_classes=[IsAuthenticated],
    )
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["patch"], url_path="me/avatar")
    def update_avatar(self, request):
        user = request.user
        avatar_url = request.data.get("avatar_url", "")
        user.avatar_url = avatar_url
        user.save(update_fields=["avatar_url"])
        return Response({"avatar_url": user.avatar_url})

    @action(detail=True, methods=["get"], url_path="followers")
    def followers(self, request, pk=None):
        user = self.get_object()
        followers_qs = User.objects.filter(
            followings__following=user,
        ).distinct()

        serializer = self.get_serializer(followers_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="followings")
    def followings(self, request, pk=None):
        user = self.get_object()
        followings_qs = User.objects.filter(
            followers__follower=user,
        ).distinct()

        serializer = self.get_serializer(followings_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="badges")
    def badges(self, request, pk=None):
        user = self.get_object()
        badges_qs = (
            UserBadge.objects.filter(user=user)
            .select_related("badge", "source_tour")
            .order_by("-earned_at")
        )

        page = self.paginate_queryset(badges_qs)
        if page is not None:
            serializer = UserBadgeSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = UserBadgeSerializer(badges_qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="following-feed")
    def following_feed(self, request):
        current_user = request.user

        following_ids = Follow.objects.filter(follower=current_user).values_list(
            "following_id", flat=True
        )

        completed_progress = (
            TourProgress.objects.filter(
                user_id__in=following_ids, status=TourProgress.COMPLETED
            )
            .select_related("user", "tour")
            .order_by("-completed_at")
        )

        page = self.paginate_queryset(completed_progress)

        if page is not None:
            serializer = FollowingFeedSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = FollowingFeedSerializer(completed_progress, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get", "post", "delete"],
        url_path="search-history",
        permission_classes=[IsAuthenticated],
    )
    def search_history(self, request):
        if request.method == "GET":
            search_type = request.query_params.get("search_type")
            queryset = SearchHistory.objects.filter(user=request.user)
            if search_type:
                queryset = queryset.filter(search_type=search_type)
            serializer = SearchHistorySerializer(queryset[:8], many=True)
            return Response(serializer.data)

        if request.method == "DELETE":
            search_type = request.query_params.get("search_type")
            query = request.query_params.get("query")
            queryset = SearchHistory.objects.filter(user=request.user)
            if search_type:
                queryset = queryset.filter(search_type=search_type)
            if query:
                queryset = queryset.filter(query=query)
            queryset.delete()
            return Response(status=204)

        serializer = SearchHistorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        search_history, created = SearchHistory.objects.update_or_create(
            user=request.user,
            search_type=serializer.validated_data["search_type"],
            query=serializer.validated_data["query"],
            defaults={"searched_at": timezone.now()},
        )
        stale_ids = list(
            SearchHistory.objects.filter(
                user=request.user,
                search_type=serializer.validated_data["search_type"],
            )
            .order_by("-searched_at")
            .values_list("id", flat=True)[8:]
        )
        if stale_ids:
            SearchHistory.objects.filter(id__in=stale_ids).delete()
        response_serializer = SearchHistorySerializer(search_history)
        return Response(response_serializer.data, status=201 if created else 200)

    @action(
        detail=False,
        methods=["post"],
        url_path="request-password-reset",
        permission_classes=[AllowAny],
        throttle_classes=[PasswordResetRequestThrottle],
    )
    def request_password_reset(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "email required"}, status=400)

        neutral = {"detail": "If that email is registered, a code has been sent."}

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(neutral, status=200)

        otp = PasswordResetOTP.generate_for(user)
        try:
            send_mail(
                subject="Your Odyssey password reset code",
                message=(
                    f"Hi {user.username},\n\n"
                    f"Your password reset code is: {otp.code}\n\n"
                    "It expires in 10 minutes. If you didn't request this, ignore this email."
                ),
                from_email=None,
                recipient_list=[user.email],
            )
        except Exception as e:
            logger.error("Failed to send password reset email to %s: %s", user.email, e)
            return Response(neutral, status=200)
        return Response(neutral, status=200)

    @action(
        detail=False,
        methods=["post"],
        url_path="reset-password",
        permission_classes=[AllowAny],
        throttle_classes=[PasswordResetConfirmThrottle],
    )
    def reset_password(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")

        if not all([email, code, new_password]):
            return Response(
                {"detail": "email, code and new_password required"}, status=400
            )

        try:
            user = User.objects.get(email__iexact=email)
            otp = PasswordResetOTP.objects.filter(user=user, used=False).latest(
                "created_at"
            )
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response({"detail": "Invalid or expired code"}, status=400)

        if not otp.can_attempt():
            return Response({"detail": "Invalid or expired code"}, status=400)

        if not secrets.compare_digest(otp.code, str(code)):
            otp.attempts = otp.attempts + 1
            otp.save(update_fields=["attempts"])
            return Response({"detail": "Invalid or expired code"}, status=400)

        user.set_password(new_password)
        user.save()
        otp.used = True
        otp.save(update_fields=["used"])
        return Response({"detail": "Password updated successfully"}, status=200)

    @action(
        detail=True, methods=["get"], url_path="published-tours", permission_classes=[]
    )
    def published_tours(self, request, pk=None):
        """Return published tours created by a specific user."""
        tours = (
            Tour.objects.filter(creator_id=pk, status=Tour.PUBLISHED)
            .annotate(average_rating=Avg("reviews__rating"))
            .order_by("-created_at")
        )
        serializer = TourSerializer(tours, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["delete"], url_path="remove-follower")
    def remove_follower(self, request, pk=None):
        """Remove a specific user from the current user's followers."""
        follower_user = self.get_object()  # user to be removed as a follower
        try:
            follow = Follow.objects.get(follower=follower_user, following=request.user)
        except Follow.DoesNotExist:
            return Response({"error": "Follow relationship not found"}, status=404)

        User.objects.filter(id=follow.following_id).update(
            follower_count=F("follower_count") - 1
        )
        User.objects.filter(id=follow.follower_id).update(
            following_count=F("following_count") - 1
        )
        follow.delete()
        return Response(status=204)

    @action(
        detail=False, methods=["get"], url_path="get-filtered-users-add-friend"
    )  # filter by username to add friend (excludes itself and already following)
    def get_filtered_users_add_friend(self, request):
        filter = request.query_params.get("filter")
        if not filter:
            return Response({"error": "filter is required"}, status=400)

        current_user = request.user

        following_ids = Follow.objects.filter(follower=current_user).values_list(
            "following_id", flat=True
        )

        print(following_ids)

        users = (
            User.objects.filter(username__icontains=filter)
            .exclude(id=current_user.id)
            .exclude(id__in=following_ids)
        )

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class FollowViewSet(CreateModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = FollowSerializer
    permission_classes = [IsAuthenticated]

    lookup_field = "following"

    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user).select_related(
            "following"
        )

    def perform_create(self, serializer):
        follow = serializer.save(follower=self.request.user)
        # increment counters
        User.objects.filter(id=follow.following_id).update(
            follower_count=F("follower_count") + 1
        )
        User.objects.filter(id=follow.follower_id).update(
            following_count=F("following_count") + 1
        )
        follow.follower.refresh_from_db(fields=["follower_count", "following_count"])
        follow.following.refresh_from_db(fields=["follower_count", "following_count"])
        BadgeService.evaluate_user_badges(follow.follower)
        BadgeService.evaluate_user_badges(follow.following)

    def perform_destroy(self, instance):
        # decrement counters safely on unfollow
        User.objects.filter(id=instance.following_id).update(
            follower_count=F("follower_count") - 1
        )
        User.objects.filter(id=instance.follower_id).update(
            following_count=F("following_count") - 1
        )

        follower = instance.follower
        following = instance.following
        instance.delete()
        follower.refresh_from_db(fields=["follower_count", "following_count"])
        following.refresh_from_db(fields=["follower_count", "following_count"])
        BadgeService.evaluate_user_badges(follower)
        BadgeService.evaluate_user_badges(following)
