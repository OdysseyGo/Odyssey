from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .errors import get_generation_error_message
from .models import GenerationJob
from .views import GenerateTourView, _run_generation


def _payload():
    return {
        "city": "Istanbul",
        "country": "Turkey",
        "country_code": "TR",
        "theme": "History",
        "mode": "STORY",
        "duration": 60,
        "language": "en",
        "additional_details": "",
        "include_ar": False,
    }


class GenerationJobErrorSanitizationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="ai_user",
            email="ai@example.com",
            password="pass123",
        )

    @patch("apps.ai_content.views.GeminiService")
    def test_failed_job_stores_sanitized_error(self, mock_service_cls):
        job = GenerationJob.objects.create(creator=self.user)
        raw_error = AttributeError("'NoneType' object has no attribute 'text'")
        mock_service_cls.return_value.generate_tour.side_effect = raw_error

        _run_generation(job.id, _payload(), self.user.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.FAILED)
        self.assertEqual(
            job.error,
            "We could not generate your tour right now. Please try again.",
        )
        self.assertNotIn("NoneType", job.error)
        self.assertNotIn("attribute", job.error)

    def test_no_places_error_has_user_actionable_message(self):
        message = get_generation_error_message(
            ValueError(
                "Could not find any real places for theme 'x' in 'y'. "
                "Please try a different city or theme."
            )
        )

        self.assertEqual(
            message,
            "We could not find enough real places for that city and theme. "
            "Try a different city, theme, or more general details.",
        )

    def test_ai_response_validation_error_is_sanitized(self):
        message = get_generation_error_message(
            ValueError("AI response is missing required keys: title")
        )

        self.assertEqual(
            message,
            "The AI response could not be turned into a valid tour. Please try again.",
        )


class GenerateTourViewLimitTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="limit_user",
            email="limit@example.com",
            password="pass123",
        )
        self.factory = APIRequestFactory()
        self.view = GenerateTourView.as_view()

    def _post(self):
        request = self.factory.post("/api/ai/generate-tour/", _payload(), format="json")
        force_authenticate(request, user=self.user)
        return self.view(request)

    def test_rejects_when_user_has_active_generation_job(self):
        GenerationJob.objects.create(creator=self.user, status=GenerationJob.RUNNING)

        response = self._post()

        self.assertEqual(response.status_code, 409)
        self.assertEqual(GenerationJob.objects.filter(creator=self.user).count(), 1)
        self.assertIn("already have a tour generation", response.data["error"])

    @patch("apps.ai_content.views.threading.Thread")
    def test_creates_job_when_user_has_no_active_generation_job(self, mock_thread_cls):
        response = self._post()

        self.assertEqual(response.status_code, 202)
        self.assertEqual(GenerationJob.objects.filter(creator=self.user).count(), 1)
        self.assertEqual(response.data["status"], GenerationJob.PENDING)
        mock_thread_cls.return_value.start.assert_called_once()
