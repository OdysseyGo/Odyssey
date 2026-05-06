from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.admin_dashboard.api.views import (
    AdminARModelViewSet,
    AdminTourViewSet,
    AdminUserViewSet,
    AnalyticsViewSet,
    BadgeVisualViewSet,
    PictureCompareConfigViewSet,
    PictureCompareTuningViewSet,
    ReportViewSet,
    SubmitReportView,
    UserRuntimeConfigViewSet,
)

router = DefaultRouter()
router.register(r"users", AdminUserViewSet, basename="admin-user")
router.register(r"tours", AdminTourViewSet, basename="admin-tour")
router.register(r"ar-models", AdminARModelViewSet, basename="admin-ar-model")
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
router.register(
    r"default-reviewer-config",
    UserRuntimeConfigViewSet,
    basename="admin-default-reviewer-config",
)
router.register(
    r"badge-visuals",
    BadgeVisualViewSet,
    basename="admin-badge-visuals",
)

urlpatterns = [
    path("", include(router.urls)),
]

# User-facing report submission (wired separately in config/urls.py)
report_urlpatterns = [
    path("", SubmitReportView.as_view(), name="submit-report"),
]
