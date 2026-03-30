from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.admin_dashboard.api.views import (
    AdminTourViewSet,
    AdminUserViewSet,
    AnalyticsViewSet,
    ReportViewSet,
    SubmitReportView,
)

router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")
router.register(r"tours", AdminTourViewSet, basename="admin-tour")
router.register(r"analytics", AnalyticsViewSet, basename="admin-analytics")
router.register(r"reports", ReportViewSet, basename="admin-report")

urlpatterns = [
    path("", include(router.urls)),
]

# User-facing report submission (wired separately in config/urls.py)
report_urlpatterns = [
    path("", SubmitReportView.as_view(), name="submit-report"),
]
