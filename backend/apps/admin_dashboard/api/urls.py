from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.admin_dashboard.api.views import (
    AdminTourViewSet,
    AdminUserViewSet,
    AnalyticsViewSet,
    PictureCompareConfigViewSet,
    PictureCompareTuningViewSet,
    ReportViewSet,
    SubmitReportView,
)

router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")
router.register(r"tours", AdminTourViewSet, basename="admin-tour")
router.register(r"analytics", AnalyticsViewSet, basename="admin-analytics")
router.register(r"reports", ReportViewSet, basename="admin-report")
router.register(
    r"picture-compare-tuning",
    PictureCompareTuningViewSet,
    basename="admin-picture-compare-tuning",
)
router.register(
    r"picture-compare-config",
    PictureCompareConfigViewSet,
    basename="admin-picture-compare-config",
)

urlpatterns = [
    path("", include(router.urls)),
]

# User-facing report submission (wired separately in config/urls.py)
report_urlpatterns = [
    path("", SubmitReportView.as_view(), name="submit-report"),
]
