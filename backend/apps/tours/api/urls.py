from django.urls import include, path
from rest_framework_nested import routers

from .views import ReviewViewSet, TourStepViewSet, TourViewSet, google_maps_api_key

# Main router for tours
router = routers.DefaultRouter()
router.register(r"tours", TourViewSet, basename="tour")

# Nested router for steps and reviews within tours
tours_router = routers.NestedDefaultRouter(router, r"tours", lookup="tour")
tours_router.register(r"steps", TourStepViewSet, basename="tour-steps")
tours_router.register(r"reviews", ReviewViewSet, basename="tour-reviews")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(tours_router.urls)),
    path("config/maps-key/", google_maps_api_key, name="google-maps-api-key"),
]
