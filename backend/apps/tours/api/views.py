import os

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Avg, Count, OuterRef, Subquery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.gamification.models import TourProgress
from apps.gamification.services import BadgeService
from apps.tours.models import (
    ARModel,
    ArPuzzleDetail,
    CompassPuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Review,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)

from ..permissions import IsCreatorOrReadOnly
from ..utils import recalculate_tour_metrics
from .filters import TourFilter
from .pagination import TourPagination
from .serializers import (
    DEFAULT_PICTURE_COMPARE_THRESHOLD,
    ARModelSerializer,
    ArPuzzleUpsertSerializer,
    CompassPuzzleUpsertSerializer,
    OpenEndedPuzzleUpsertSerializer,
    PictureComparePuzzleUpsertSerializer,
    PuzzleSerializer,
    ReviewSerializer,
    TourInBoundsMapSerializer,
    TourSerializer,
    TourStepSerializer,
    TriviaPuzzleUpsertSerializer,
)

MAX_TOUR_STEPS = 150


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def google_maps_api_key(request):
    return Response({"key": os.getenv("GOOGLE_MAPS_API_KEY", "")})


class TourViewSet(viewsets.ModelViewSet):
    queryset = (
        Tour.objects.all()
        .annotate(average_rating=Avg("reviews__rating"))
        .order_by("-created_at")
    )
    serializer_class = TourSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]
    pagination_class = TourPagination
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = TourFilter
    search_fields = ["title", "description", "category", "city", "country"]
    ordering_fields = [
        "created_at",
        "average_rating",
        "duration_minutes",
        "total_distance",
        "accessibility_rating",
    ]

    def get_queryset(self):
        first_lat = Subquery(
            TourStep.objects.filter(tour=OuterRef("pk"))
            .order_by("order")
            .values("latitude")[:1]
        )
        first_lng = Subquery(
            TourStep.objects.filter(tour=OuterRef("pk"))
            .order_by("order")
            .values("longitude")[:1]
        )

        queryset = (
            super()
            .get_queryset()
            .annotate(
                first_lat=first_lat,
                first_lng=first_lng,
            )
        )
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        creator = self.request.query_params.get("creator")
        if creator:
            queryset = queryset.filter(creator_id=creator)

        # If not creator/staff, only show published tours
        if self.action == "list" and not self.request.user.is_staff:
            queryset = queryset.filter(status=Tour.PUBLISHED)

        return queryset

    def perform_create(self, serializer):
        # Default to production-safe behavior when ENV_MODE is unset.
        env_mode = os.getenv("ENV_MODE", "production")
        if env_mode != "development":
            status = Tour.PENDING
        else:
            status = Tour.PUBLISHED
        tour = serializer.save(creator=self.request.user, status=status)
        BadgeService.evaluate_user_badges(tour.creator)

    @action(
        detail=False,
        methods=["get"],
        url_path="ar-models",
        permission_classes=[permissions.IsAuthenticated],
    )
    def ar_models(self, request):
        queryset = ARModel.objects.filter(is_active=True).order_by("sort_order", "id")
        serializer = ARModelSerializer(
            queryset,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="in-bounds",
        permission_classes=[permissions.IsAuthenticatedOrReadOnly],
    )
    def in_bounds(self, request):
        """Return published tours whose first step falls inside the given bounding box."""
        try:
            north = float(request.query_params["north"])
            south = float(request.query_params["south"])
            east = float(request.query_params["east"])
            west = float(request.query_params["west"])
        except (KeyError, ValueError):
            return Response(
                {"error": "north, south, east, west are required."}, status=400
            )

        sort = request.query_params.get("sort", "rating").strip().lower()
        fields = request.query_params.get("fields", "full").strip().lower()
        limit_param = request.query_params.get("limit")

        limit = None
        if limit_param is not None:
            try:
                limit = max(1, min(int(limit_param), 500))
            except ValueError:
                return Response(
                    {"error": "limit must be an integer."}, status=400
                )

        first_lat = Subquery(
            TourStep.objects.filter(tour=OuterRef("pk"))
            .order_by("order")
            .values("latitude")[:1]
        )
        first_lng = Subquery(
            TourStep.objects.filter(tour=OuterRef("pk"))
            .order_by("order")
            .values("longitude")[:1]
        )

        tours = (
            Tour.objects.filter(status=Tour.PUBLISHED)
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Count("reviews", distinct=True),
                first_lat=first_lat,
                first_lng=first_lng,
            )
            .filter(
                first_lat__gte=south,
                first_lat__lte=north,
                first_lng__gte=west,
                first_lng__lte=east,
            )
        )

        if sort == "name":
            tours = tours.order_by("title", "-average_rating", "-review_count", "-id")
        elif sort == "reviews":
            tours = tours.order_by("-review_count", "-average_rating", "-id")
        elif sort == "newest":
            tours = tours.order_by("-created_at")
        else:
            tours = tours.order_by("-average_rating", "-review_count", "-id")

        if limit is not None:
            tours = tours[:limit]

        if fields == "map":
            serializer = TourInBoundsMapSerializer(tours, many=True, context={"request": request})
        else:
            tours = tours.prefetch_related("steps", "reviews__user", "creator")
            serializer = self.get_serializer(tours, many=True)

        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="my-tours",
        permission_classes=[permissions.IsAuthenticated],
    )
    def my_tours(self, request):
        """Return tours created by the current user, optionally filtered by status."""
        queryset = Tour.objects.filter(creator=request.user)

        status = request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        generation_source = request.query_params.get("generation_source")
        if generation_source:
            if generation_source not in {Tour.USER, Tour.AI}:
                return Response(
                    {
                        "error": (
                            "generation_source must be one of: "
                            f"{Tour.USER}, {Tour.AI}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(generation_source=generation_source)

        is_ai_generated = request.query_params.get("is_ai_generated")
        if is_ai_generated is not None:
            normalized_is_ai_generated = str(is_ai_generated).strip().lower()
            if normalized_is_ai_generated not in {"true", "false"}:
                return Response(
                    {"error": "is_ai_generated must be either 'true' or 'false'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            queryset = queryset.filter(
                is_ai_generated=normalized_is_ai_generated == "true"
            )

        queryset = queryset.annotate(average_rating=Avg("reviews__rating")).order_by(
            "-updated_at"
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=False,
        methods=["get"],
        url_path="my-completed-tours",
        permission_classes=[permissions.IsAuthenticated],
    )
    def my_completed_tours(self, request):
        """Return tours that the current user has completed."""

        # Use has_completed_once instead of only status=COMPLETED. Replaying a
        # completed tour resets the same progress row to IN_PROGRESS, but the
        # user should still be allowed to reveal completed-tour content.
        completed_tour_ids = TourProgress.objects.filter(
            user=request.user, has_completed_once=True
        ).values_list("tour_id", flat=True)

        queryset = Tour.objects.filter(id__in=completed_tour_ids)

        # Optional status filter (PUBLISHED or ARCHIVED)
        status = request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        queryset = queryset.annotate(average_rating=Avg("reviews__rating")).order_by(
            "-updated_at"
        )

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TourStepViewSet(viewsets.ModelViewSet):
    serializer_class = TourStepSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return TourStep.objects.filter(tour_id=self.kwargs["tour_pk"]).order_by("order")

    def perform_create(self, serializer):
        tour_id = self.kwargs["tour_pk"]
        if TourStep.objects.filter(tour_id=tour_id).count() >= MAX_TOUR_STEPS:
            raise ValidationError(
                {"steps": f"A tour can have at most {MAX_TOUR_STEPS} steps."}
            )

        step = serializer.save(tour_id=self.kwargs["tour_pk"])
        recalculate_tour_metrics(step.tour)

    def perform_update(self, serializer):
        step = serializer.save()
        recalculate_tour_metrics(step.tour)

    def perform_destroy(self, instance):
        tour = instance.tour
        instance.delete()
        recalculate_tour_metrics(tour)

    def _user_can_edit_step_puzzle(self, request, step):
        return step.tour.creator_id == request.user.id or request.user.is_staff

    def _upsert_base_puzzle(self, *, step, puzzle_type, data):
        fixed_xp_reward = Puzzle.fixed_xp_reward_for_type(puzzle_type)
        puzzle, created = Puzzle.objects.get_or_create(
            step=step,
            defaults={
                "puzzle_type": puzzle_type,
                "question": data["question"],
                "hint": data.get("hint", ""),
                "xp_reward": fixed_xp_reward,
                "correct_answer": "",
            },
        )

        if not created:
            puzzle.puzzle_type = puzzle_type
            puzzle.question = data["question"]
            puzzle.hint = data.get("hint", "")
            puzzle.xp_reward = fixed_xp_reward
            puzzle.save(
                update_fields=[
                    "puzzle_type",
                    "question",
                    "hint",
                    "xp_reward",
                    "updated_at",
                ]
            )

        return puzzle, created

    @staticmethod
    def _clear_other_puzzle_details(puzzle, keep_type):
        if keep_type != Puzzle.TRIVIA:
            trivia_detail = getattr(puzzle, "trivia_detail", None)
            if trivia_detail is not None:
                trivia_detail.delete()

        if keep_type != Puzzle.PICTURE_COMPARE:
            picture_detail = getattr(puzzle, "picture_compare_detail", None)
            if picture_detail is not None:
                picture_detail.delete()

        if keep_type != Puzzle.AR:
            ar_detail = getattr(puzzle, "ar_detail", None)
            if ar_detail is not None:
                ar_detail.delete()

        if keep_type != Puzzle.COMPASS:
            compass_detail = getattr(puzzle, "compass_detail", None)
            if compass_detail is not None:
                compass_detail.delete()

    @action(detail=True, methods=["get"], url_path="puzzle")
    def get_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not hasattr(step, "puzzle"):
            return Response(
                {"error": "This step has no puzzle configured."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PuzzleSerializer(step.puzzle, context={"request": request})
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["delete"],
        url_path="puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def delete_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()

        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can delete this puzzle."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not hasattr(step, "puzzle"):
            return Response(status=status.HTTP_204_NO_CONTENT)

        step.puzzle.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(
        detail=True,
        methods=["post"],
        url_path="set-trivia-puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_trivia_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can configure puzzles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = TriviaPuzzleUpsertSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        puzzle, created = self._upsert_base_puzzle(
            step=step,
            puzzle_type=Puzzle.TRIVIA,
            data=data,
        )

        puzzle.options = data["options"]
        puzzle.correct_answer = data["correct_answer"]
        puzzle.reference_image = None
        puzzle.save(
            update_fields=["options", "correct_answer", "reference_image", "updated_at"]
        )

        self._clear_other_puzzle_details(puzzle, Puzzle.TRIVIA)
        TriviaPuzzleDetail.objects.update_or_create(
            puzzle=puzzle,
            defaults={
                "options": data["options"],
                "correct_answer": data["correct_answer"],
            },
        )

        serializer = PuzzleSerializer(puzzle, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-open-ended-puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_open_ended_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can configure puzzles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = OpenEndedPuzzleUpsertSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        puzzle, created = self._upsert_base_puzzle(
            step=step,
            puzzle_type=Puzzle.OPEN_ENDED,
            data=data,
        )
        puzzle.options = None
        puzzle.correct_answer = data["correct_answer"]
        puzzle.reference_image = None
        puzzle.save(
            update_fields=["options", "correct_answer", "reference_image", "updated_at"]
        )

        self._clear_other_puzzle_details(puzzle, Puzzle.OPEN_ENDED)

        serializer = PuzzleSerializer(puzzle, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-picture-compare-puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_picture_compare_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can configure puzzles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = PictureComparePuzzleUpsertSerializer(
            data=request.data,
            context={"step": step},
        )
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        puzzle, created = self._upsert_base_puzzle(
            step=step,
            puzzle_type=Puzzle.PICTURE_COMPARE,
            data=data,
        )

        reference_image = data.get("reference_image")
        if reference_image is not None:
            puzzle.reference_image = reference_image

        puzzle.options = []
        puzzle.correct_answer = "PICTURE_COMPARE"
        puzzle.save(
            update_fields=["options", "correct_answer", "reference_image", "updated_at"]
        )

        self._clear_other_puzzle_details(puzzle, Puzzle.PICTURE_COMPARE)
        current_detail = getattr(puzzle, "picture_compare_detail", None)
        detail_reference_image = (
            reference_image
            if reference_image is not None
            else (
                current_detail.reference_image if current_detail is not None else None
            )
        )

        if detail_reference_image is None:
            return Response(
                {
                    "reference_image": (
                        "reference_image is required for PICTURE_COMPARE puzzles."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        threshold = (
            data.get("similarity_threshold")
            if data.get("similarity_threshold") is not None
            else (
                current_detail.similarity_threshold
                if current_detail is not None
                else DEFAULT_PICTURE_COMPARE_THRESHOLD
            )
        )
        PictureComparePuzzleDetail.objects.update_or_create(
            puzzle=puzzle,
            defaults={
                "reference_image": detail_reference_image,
                "similarity_threshold": threshold,
            },
        )

        serializer = PuzzleSerializer(puzzle, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-ar-puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_ar_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can configure puzzles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = ArPuzzleUpsertSerializer(
            data=request.data,
            context={"request": request},
        )
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        puzzle, created = self._upsert_base_puzzle(
            step=step,
            puzzle_type=Puzzle.AR,
            data=data,
        )
        puzzle.options = None
        puzzle.correct_answer = ""
        puzzle.reference_image = None
        puzzle.save(
            update_fields=["options", "correct_answer", "reference_image", "updated_at"]
        )

        self._clear_other_puzzle_details(puzzle, Puzzle.AR)
        ArPuzzleDetail.objects.update_or_create(
            puzzle=puzzle,
            defaults={
                "scene_asset_url": data.get("scene_asset_url", ""),
                "metadata": data.get("metadata", {}),
            },
        )

        serializer = PuzzleSerializer(puzzle, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-compass-puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_compass_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can configure puzzles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = CompassPuzzleUpsertSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        puzzle, created = self._upsert_base_puzzle(
            step=step,
            puzzle_type=Puzzle.COMPASS,
            data=data,
        )
        puzzle.options = None
        puzzle.correct_answer = ""
        puzzle.reference_image = None
        puzzle.save(
            update_fields=["options", "correct_answer", "reference_image", "updated_at"]
        )

        self._clear_other_puzzle_details(puzzle, Puzzle.COMPASS)
        CompassPuzzleDetail.objects.update_or_create(
            puzzle=puzzle,
            defaults={
                "target_heading_degrees": data["target_heading_degrees"],
            },
        )

        serializer = PuzzleSerializer(puzzle, context={"request": request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="set-picture-reference",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_picture_reference(self, request, tour_pk=None, pk=None):
        step = self.get_object()

        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {
                    "error": "Only the tour creator can update the puzzle reference image."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not hasattr(step, "puzzle"):
            return Response(
                {"error": "This step has no puzzle configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        puzzle = step.puzzle
        if puzzle.puzzle_type != Puzzle.PICTURE_COMPARE:
            return Response(
                {"error": "This step puzzle is not PICTURE_COMPARE."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reference_image = request.FILES.get("reference_image") or request.FILES.get(
            "image"
        )
        if not reference_image:
            return Response(
                {"error": "Provide reference_image or image file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        puzzle.reference_image = reference_image
        puzzle.correct_answer = "PICTURE_COMPARE"

        try:
            puzzle.save(
                update_fields=["reference_image", "correct_answer", "updated_at"]
            )
            detail = getattr(puzzle, "picture_compare_detail", None)
            threshold = (
                detail.similarity_threshold
                if detail is not None
                else DEFAULT_PICTURE_COMPARE_THRESHOLD
            )
            PictureComparePuzzleDetail.objects.update_or_create(
                puzzle=puzzle,
                defaults={
                    "reference_image": reference_image,
                    "similarity_threshold": threshold,
                },
            )
            self._clear_other_puzzle_details(puzzle, Puzzle.PICTURE_COMPARE)
        except DjangoValidationError as exc:
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)

        serializer = PuzzleSerializer(puzzle, context={"request": request})
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(tour_id=self.kwargs["tour_pk"]).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        tour = Tour.objects.only("id", "creator_id").get(pk=self.kwargs["tour_pk"])
        if tour.creator_id == self.request.user.id:
            raise PermissionDenied("You cannot review your own tour.")

        serializer.save(user=self.request.user, tour=tour)
        BadgeService.evaluate_user_badges(self.request.user)
        BadgeService.evaluate_user_badges(tour.creator)

    def perform_update(self, serializer):
        if serializer.instance.tour.creator_id == self.request.user.id:
            raise PermissionDenied("You cannot review your own tour.")
        if (
            serializer.instance.user_id != self.request.user.id
            and not self.request.user.is_staff
        ):
            raise PermissionDenied("You can only edit your own review.")

        serializer.save()

    def perform_destroy(self, instance):
        if instance.tour.creator_id == self.request.user.id:
            raise PermissionDenied("You cannot review your own tour.")
        if instance.user_id != self.request.user.id and not self.request.user.is_staff:
            raise PermissionDenied("You can only delete your own review.")

        instance.delete()
