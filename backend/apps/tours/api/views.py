import os

<<<<<<< KAN-78-Adding-cool-features-to-map
from django.db.models import Avg, OuterRef, Subquery
=======
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Avg
>>>>>>> main
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from apps.gamification.models import TourProgress
from apps.tours.models import (
    ArPuzzleDetail,
    GyroscopePuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Review,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)

from ..permissions import IsCreatorOrReadOnly
from .filters import TourFilter
from .pagination import TourPagination
from .serializers import (
    DEFAULT_PICTURE_COMPARE_THRESHOLD,
    ArPuzzleUpsertSerializer,
    GyroscopePuzzleUpsertSerializer,
    PictureComparePuzzleUpsertSerializer,
    PuzzleSerializer,
    ReviewSerializer,
    TourSerializer,
    TourStepSerializer,
    TriviaPuzzleUpsertSerializer,
)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
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
    search_fields = ["title", "description", "category", "city"]
    ordering_fields = [
        "created_at",
        "average_rating",
        "duration_minutes",
        "total_distance",
        "accessibility_rating",
    ]

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get("status")
        if status:
            queryset = queryset.filter(status=status)

        # If not creator/staff, only show published tours
        if self.action == "list" and not self.request.user.is_staff:
            queryset = queryset.filter(status=Tour.PUBLISHED)

        return queryset

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

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
                first_lat=first_lat,
                first_lng=first_lng,
            )
            .filter(
                first_lat__gte=south,
                first_lat__lte=north,
                first_lng__gte=west,
                first_lng__lte=east,
            )
            .prefetch_related("steps", "reviews__user", "creator")
        )

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

        # Get tour IDs that the user has completed
        completed_tour_ids = TourProgress.objects.filter(
            user=request.user, status=TourProgress.COMPLETED
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
        serializer.save(tour_id=self.kwargs["tour_pk"])

    def _user_can_edit_step_puzzle(self, request, step):
        return step.tour.creator_id == request.user.id or request.user.is_staff

    def _upsert_base_puzzle(self, *, step, puzzle_type, data):
        puzzle, created = Puzzle.objects.get_or_create(
            step=step,
            defaults={
                "puzzle_type": puzzle_type,
                "question": data["question"],
                "hint": data.get("hint", ""),
                "xp_reward": data.get("xp_reward", 10),
                "correct_answer": "",
            },
        )

        if not created:
            puzzle.puzzle_type = puzzle_type
            puzzle.question = data["question"]
            puzzle.hint = data.get("hint", "")
            puzzle.xp_reward = data.get("xp_reward", puzzle.xp_reward)
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

        if keep_type != Puzzle.GYROSCOPE:
            gyro_detail = getattr(puzzle, "gyroscope_detail", None)
            if gyro_detail is not None:
                gyro_detail.delete()

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

        payload = ArPuzzleUpsertSerializer(data=request.data)
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
        url_path="set-gyroscope-puzzle",
        permission_classes=[permissions.IsAuthenticated],
    )
    def set_gyroscope_puzzle(self, request, tour_pk=None, pk=None):
        step = self.get_object()
        if not self._user_can_edit_step_puzzle(request, step):
            return Response(
                {"error": "Only the tour creator can configure puzzles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        payload = GyroscopePuzzleUpsertSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        puzzle, created = self._upsert_base_puzzle(
            step=step,
            puzzle_type=Puzzle.GYROSCOPE,
            data=data,
        )
        puzzle.options = None
        puzzle.correct_answer = ""
        puzzle.reference_image = None
        puzzle.save(
            update_fields=["options", "correct_answer", "reference_image", "updated_at"]
        )

        self._clear_other_puzzle_details(puzzle, Puzzle.GYROSCOPE)
        GyroscopePuzzleDetail.objects.update_or_create(
            puzzle=puzzle,
            defaults={
                "target_pitch": data.get("target_pitch", 0.0),
                "target_roll": data.get("target_roll", 0.0),
                "target_yaw": data.get("target_yaw", 0.0),
                "tolerance_degrees": data.get("tolerance_degrees", 15.0),
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
        serializer.save(user=self.request.user, tour_id=self.kwargs["tour_pk"])
