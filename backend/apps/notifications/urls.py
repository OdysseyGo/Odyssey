from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import DeviceTokenViewSet, NotificationPreferenceViewSet

router = DefaultRouter()
router.register(r"device-tokens", DeviceTokenViewSet, basename="device-token")

urlpatterns = [
    path("notifications/", include(router.urls)),
    path(
        "notifications/preferences/",
        NotificationPreferenceViewSet.as_view(
            {"get": "list", "patch": "partial_update", "put": "update"}
        ),
        name="notification-preferences",
    ),
]
