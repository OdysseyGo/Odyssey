from django.urls import path

from apps.admin_dashboard.api.views import SubmitReportView

urlpatterns = [
    path("", SubmitReportView.as_view(), name="submit-report"),
]
