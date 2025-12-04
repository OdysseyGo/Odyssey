from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BadgeViewSet, UserBadgeViewSet, TourProgressViewSet

router = DefaultRouter()
router.register(r'badges', BadgeViewSet, basename='badge')
router.register(r'my-badges', UserBadgeViewSet, basename='user-badge')
router.register(r'tour-progress', TourProgressViewSet, basename='tour-progress')

urlpatterns = [
    path('', include(router.urls)),
]
