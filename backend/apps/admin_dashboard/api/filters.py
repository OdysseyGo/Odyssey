from django_filters import rest_framework as filters

from apps.admin_dashboard.models import Report
from apps.tours.models import Tour
from apps.users.models import User


class AdminUserFilter(filters.FilterSet):
    user_type = filters.NumberFilter()
    country = filters.CharFilter(lookup_expr="icontains")
    is_staff = filters.BooleanFilter()
    is_banned = filters.BooleanFilter()
    date_joined_after = filters.DateTimeFilter(
        field_name="date_joined", lookup_expr="gte"
    )
    date_joined_before = filters.DateTimeFilter(
        field_name="date_joined", lookup_expr="lte"
    )

    class Meta:
        model = User
        fields = ["user_type", "country", "is_staff", "is_banned"]


class AdminTourFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Tour.STATUS_CHOICES)
    tour_type = filters.ChoiceFilter(choices=Tour.TOUR_TYPE_CHOICES)
    difficulty = filters.ChoiceFilter(choices=Tour.DIFFICULTY_CHOICES)
    city = filters.CharFilter(lookup_expr="icontains")
    creator = filters.NumberFilter(field_name="creator_id")
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Tour
        fields = ["status", "tour_type", "difficulty", "city", "creator"]


class ReportFilter(filters.FilterSet):
    status = filters.ChoiceFilter(choices=Report.STATUS_CHOICES)
    content_type = filters.ChoiceFilter(choices=Report.CONTENT_TYPE_CHOICES)
    created_after = filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")

    class Meta:
        model = Report
        fields = ["status", "content_type"]
