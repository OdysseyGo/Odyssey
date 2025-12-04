from rest_framework import viewsets, permissions, filters
from django.db.models import Avg
from apps.tours.models import Tour, TourStep, Review
from .serializers import TourSerializer, TourStepSerializer, ReviewSerializer
from ..permissions import IsCreatorOrReadOnly

class TourViewSet(viewsets.ModelViewSet):
    queryset = Tour.objects.all().annotate(average_rating=Avg('reviews__rating')).order_by('-created_at')
    serializer_class = TourSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsCreatorOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'category']
    ordering_fields = ['created_at', 'average_rating', 'duration_minutes']

    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # If not creator/staff, only show published tours
        if self.action == 'list' and not self.request.user.is_staff:
             queryset = queryset.filter(status=Tour.PUBLISHED)
             
        return queryset

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class TourStepViewSet(viewsets.ModelViewSet):
    serializer_class = TourStepSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return TourStep.objects.filter(tour_id=self.kwargs['tour_pk']).order_by('order')

    def perform_create(self, serializer):
        serializer.save(tour_id=self.kwargs['tour_pk'])

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Review.objects.filter(tour_id=self.kwargs['tour_pk']).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, tour_id=self.kwargs['tour_pk'])
