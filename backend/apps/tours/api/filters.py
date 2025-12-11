from django_filters import rest_framework as filters
from apps.tours.models import Tour

class TourFilter(filters.FilterSet):
    min_distance = filters.NumberFilter(field_name="total_distance", lookup_expr="gte")
    max_distance = filters.NumberFilter(field_name="total_distance", lookup_expr="lte")
    min_duration = filters.NumberFilter(field_name="duration_minutes", lookup_expr="gte")
    max_duration = filters.NumberFilter(field_name="duration_minutes", lookup_expr="lte")
    difficulty = filters.ChoiceFilter(choices=Tour.DIFFICULTY_CHOICES)
    city = filters.CharFilter(lookup_expr="icontains")
    min_accessibility = filters.NumberFilter(field_name="accessibility_rating", lookup_expr="gte")

    class Meta:
        model = Tour
        fields = [
            "city", "difficulty", "tour_type", "is_premium", "status"
        ]
