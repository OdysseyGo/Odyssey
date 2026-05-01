from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    BadgeViewSet,
    LevelInfoView,
    TourProgressViewSet,
    UserBadgeHistoryViewSet,
    UserBadgeViewSet,
)

router = DefaultRouter()
router.register(r"badges", BadgeViewSet, basename="badge")
router.register(r"my-badges", UserBadgeViewSet, basename="user-badge")
router.register(r"my-badge-history", UserBadgeHistoryViewSet, basename="user-badge-history")
router.register(r"tour-progress", TourProgressViewSet, basename="tour-progress")

urlpatterns = [
    path("", include(router.urls)),
    path("level-info/", LevelInfoView.as_view(), name="level-info"),
]
