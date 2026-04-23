import os

from django.db.models import Avg, OuterRef, Subquery
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response

from apps.gamification.models import TourProgress
from apps.tours.models import Review, Tour, TourStep

from ..permissions import IsCreatorOrReadOnly
from .filters import TourFilter
from .pagination import TourPagination
from .serializers import ReviewSerializer, TourSerializer, TourStepSerializer


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


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(tour_id=self.kwargs["tour_pk"]).order_by(
            "-created_at"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, tour_id=self.kwargs["tour_pk"])
