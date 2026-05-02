from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.ads.models import AdPlacement, RewardedAdGrant

from .errors import STALE_GENERATION_JOB_ERROR, get_generation_error_message
from .models import GenerationJob
from .views import CancelGenerationJobView, GenerateTourView, _run_generation


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

    @patch("apps.ai_content.views.GeminiService")
    def test_finished_job_does_not_overwrite_stale_failure(self, mock_service_cls):
        job = GenerationJob.objects.create(creator=self.user)

        def _finish_after_stale_mark(*args, **kwargs):
            GenerationJob.objects.filter(pk=job.pk).update(
                status=GenerationJob.FAILED,
                error=STALE_GENERATION_JOB_ERROR,
            )
            return object()

        mock_service_cls.return_value.generate_tour.side_effect = (
            _finish_after_stale_mark
        )

        _run_generation(job.id, _payload(), self.user.id)

        job.refresh_from_db()
        self.assertEqual(job.status, GenerationJob.FAILED)
        self.assertEqual(job.error, STALE_GENERATION_JOB_ERROR)
        self.assertIsNone(job.tour)


class GenerateTourViewLimitTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="limit_user",
            email="limit@example.com",
            password="pass123",
        )
        self.factory = APIRequestFactory()
        self.view = GenerateTourView.as_view()
        self.ai_slot_placement = AdPlacement.objects.create(
            key="rewarded_ai_slot",
            ad_format=AdPlacement.REWARDED,
            reward_type=AdPlacement.AI_SLOT,
            reward_amount=1,
            enabled=True,
        )

    def _grant_ai_slot(self):
        return RewardedAdGrant.objects.create(
            user=self.user,
            placement=self.ai_slot_placement,
            admob_transaction_id="ai-slot-tx",
            reward_type=RewardedAdGrant.AI_SLOT,
            reward_amount=1,
        )

    def _post(self, payload=None):
        request = self.factory.post(
            "/api/ai/generate-tour/", payload or _payload(), format="json"
        )
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
        self._grant_ai_slot()
        payload = {**_payload(), "use_ad_slot": True}

        response = self._post(payload)

        self.assertEqual(response.status_code, 202)
        self.assertEqual(GenerationJob.objects.filter(creator=self.user).count(), 1)
        self.assertEqual(response.data["status"], GenerationJob.PENDING)
        mock_thread_cls.return_value.start.assert_called_once()
        self.assertTrue(
            RewardedAdGrant.objects.get(admob_transaction_id="ai-slot-tx").is_consumed
        )

    def test_rejects_generation_without_ad_slot_request(self):
        response = self._post()

        self.assertEqual(response.status_code, 403)
        self.assertIn("rewarded ad", response.data["error"])
        self.assertEqual(GenerationJob.objects.filter(creator=self.user).count(), 0)


class CancelGenerationJobViewTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="cancel_user",
            email="cancel@example.com",
            password="pass123",
        )
        self.factory = APIRequestFactory()
        self.view = CancelGenerationJobView.as_view()

    def _post(self, job):
        request = self.factory.post(f"/api/ai/jobs/{job.id}/cancel/", {}, format="json")
        force_authenticate(request, user=self.user)
        return self.view(request, id=job.id)

    def test_cancels_running_job(self):
        job = GenerationJob.objects.create(
            creator=self.user,
            status=GenerationJob.RUNNING,
            progress_label="Working",
        )

        response = self._post(job)

        job.refresh_from_db()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(job.status, GenerationJob.CANCELLED)
        self.assertEqual(job.progress_label, "")
        self.assertEqual(job.error, "Tour generation was cancelled.")

    def test_cancel_is_idempotent_for_cancelled_job(self):
        job = GenerationJob.objects.create(
            creator=self.user,
            status=GenerationJob.CANCELLED,
            error="Tour generation was cancelled.",
        )

        response = self._post(job)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], GenerationJob.CANCELLED)

    def test_cannot_cancel_finished_job(self):
        job = GenerationJob.objects.create(
            creator=self.user,
            status=GenerationJob.SUCCESS,
        )

        response = self._post(job)

        self.assertEqual(response.status_code, 409)


class CleanupGenerationJobsCommandTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="cleanup_user",
            email="cleanup@example.com",
            password="pass123",
        )

    def _job(self, status, days_old):
        job = GenerationJob.objects.create(creator=self.user, status=status)
        GenerationJob.objects.filter(pk=job.pk).update(
            updated_at=timezone.now() - timedelta(days=days_old)
        )
        job.refresh_from_db()
        return job

    def test_deletes_only_old_terminal_jobs(self):
        old_success = self._job(GenerationJob.SUCCESS, 8)
        old_failed = self._job(GenerationJob.FAILED, 9)
        old_cancelled = self._job(GenerationJob.CANCELLED, 9)
        old_running = self._job(GenerationJob.RUNNING, 10)
        recent_failed = self._job(GenerationJob.FAILED, 2)

        call_command("cleanup_generation_jobs")

        remaining_ids = set(GenerationJob.objects.values_list("id", flat=True))
        self.assertNotIn(old_success.id, remaining_ids)
        self.assertNotIn(old_failed.id, remaining_ids)
        self.assertNotIn(old_cancelled.id, remaining_ids)
        self.assertIn(old_running.id, remaining_ids)
        self.assertIn(recent_failed.id, remaining_ids)

    def test_dry_run_does_not_delete_jobs(self):
        self._job(GenerationJob.SUCCESS, 8)

        call_command("cleanup_generation_jobs", dry_run=True)

        self.assertEqual(GenerationJob.objects.count(), 1)


class FailStaleGenerationJobsCommandTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="stale_user",
            email="stale@example.com",
            password="pass123",
        )

    def _job(self, status, minutes_old):
        job = GenerationJob.objects.create(
            creator=self.user,
            status=status,
            progress_label="Working",
        )
        GenerationJob.objects.filter(pk=job.pk).update(
            updated_at=timezone.now() - timedelta(minutes=minutes_old)
        )
        job.refresh_from_db()
        return job

    def test_fails_only_stale_active_jobs(self):
        stale_running = self._job(GenerationJob.RUNNING, 31)
        stale_pending = self._job(GenerationJob.PENDING, 45)
        recent_running = self._job(GenerationJob.RUNNING, 5)
        old_success = self._job(GenerationJob.SUCCESS, 60)

        call_command("fail_stale_generation_jobs", minutes=30)

        stale_running.refresh_from_db()
        stale_pending.refresh_from_db()
        recent_running.refresh_from_db()
        old_success.refresh_from_db()

        self.assertEqual(stale_running.status, GenerationJob.FAILED)
        self.assertEqual(stale_running.error, STALE_GENERATION_JOB_ERROR)
        self.assertEqual(stale_running.progress_label, "")
        self.assertEqual(stale_pending.status, GenerationJob.FAILED)
        self.assertEqual(recent_running.status, GenerationJob.RUNNING)
        self.assertEqual(old_success.status, GenerationJob.SUCCESS)

    def test_dry_run_does_not_fail_jobs(self):
        stale_running = self._job(GenerationJob.RUNNING, 31)

        call_command("fail_stale_generation_jobs", minutes=30, dry_run=True)

        stale_running.refresh_from_db()
        self.assertEqual(stale_running.status, GenerationJob.RUNNING)
