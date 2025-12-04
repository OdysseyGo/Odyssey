from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminViewSet, FollowViewSet, UserViewSet


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("follows", FollowViewSet, basename="follow")
router.register("admins", AdminViewSet, basename="admin")

from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("", include(router.urls)),
]
