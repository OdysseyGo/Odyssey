from django.urls import path

from .views import GenerateTourView, GenerationJobView

urlpatterns = [
    path("generate-tour/", GenerateTourView.as_view(), name="generate-tour"),
    path("jobs/<uuid:id>/", GenerationJobView.as_view(), name="generation-job"),
]
