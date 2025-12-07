from django.urls import path
from .views import GenerateTourView

urlpatterns = [
    path("generate-tour/", GenerateTourView.as_view(), name="generate-tour"),
]
