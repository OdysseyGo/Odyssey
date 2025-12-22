from django.db.models import Avg
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, viewsets
from rest_framework.pagination import PageNumberPagination

from apps.tours.models import Review, Tour, TourStep

from ..permissions import IsCreatorOrReadOnly
from .filters import TourFilter
from .serializers import ReviewSerializer, TourSerializer, TourStepSerializer


class TourPagination(PageNumberPagination):
    """Custom pagination that allows clients to set page_size."""

    page_size = 10
    page_size_query_param = "page_size"
    max_page_size = 100


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
