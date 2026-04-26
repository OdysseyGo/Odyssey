from django.db.models import Q
from django_filters import rest_framework as filters

from apps.tours.models import Tour

CONTINENT_QUERIES = {
    "africa": Q(
        first_lat__gte=-35, first_lat__lte=37, first_lng__gte=-18, first_lng__lte=51
    ),
    "europe": Q(
        first_lat__gte=36, first_lat__lte=71, first_lng__gte=-25, first_lng__lte=40
    ),
    "asia": Q(
        first_lat__gte=-10, first_lat__lte=77, first_lng__gte=40, first_lng__lte=180
    ),
    "north america": Q(
        first_lat__gte=15, first_lat__lte=72, first_lng__gte=-168, first_lng__lte=-52
    ),
    "south america": Q(
        first_lat__gte=-56, first_lat__lte=13, first_lng__gte=-82, first_lng__lte=-34
    ),
    "oceania": Q(
        first_lat__gte=-47, first_lat__lte=-10, first_lng__gte=110, first_lng__lte=180
    ),
    "antarctica": Q(first_lat__lt=-60),
}


class TourFilter(filters.FilterSet):
    min_distance = filters.NumberFilter(field_name="total_distance", lookup_expr="gte")
    max_distance = filters.NumberFilter(field_name="total_distance", lookup_expr="lte")
    min_duration = filters.NumberFilter(
        field_name="duration_minutes", lookup_expr="gte"
    )
    max_duration = filters.NumberFilter(
        field_name="duration_minutes", lookup_expr="lte"
    )
    difficulty = filters.ChoiceFilter(choices=Tour.DIFFICULTY_CHOICES)
    city = filters.CharFilter(lookup_expr="icontains")
    category = filters.CharFilter(lookup_expr="iexact")
    continent = filters.CharFilter(method="filter_continent")
    country = filters.CharFilter(lookup_expr="icontains")
    country_code = filters.CharFilter(lookup_expr="iexact")
    min_accessibility = filters.NumberFilter(
        field_name="accessibility_rating", lookup_expr="gte"
    )

    def filter_continent(self, queryset, name, value):
        normalized = (value or "").strip().lower()
        if not normalized:
            return queryset

        if normalized == "other":
            known_regions = Q()
            for region_query in CONTINENT_QUERIES.values():
                known_regions |= region_query
            return queryset.filter(
                Q(first_lat__isnull=True) | Q(first_lng__isnull=True) | ~known_regions
            )

        continent_query = CONTINENT_QUERIES.get(normalized)
        if continent_query is None:
            return queryset.none()
        return queryset.filter(continent_query)

    class Meta:
        model = Tour
        fields = [
            "category",
            "continent",
            "city",
            "country",
            "country_code",
            "difficulty",
            "tour_type",
            "is_premium",
            "status",
            "creator",
        ]
