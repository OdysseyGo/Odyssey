from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import Tour, TourStep

User = get_user_model()


class TourProgressReplayTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="replay_user", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Replay Tour",
            description="Replay test",
            creator=self.user,
            tour_type=Tour.PUZZLE,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=20,
        )
        self.first_step = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="First",
            description="",
            latitude="1.0",
            longitude="1.0",
        )
        TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Second",
            description="",
            latitude="1.1",
            longitude="1.1",
        )

    def test_replay_completed_tour_resets_existing_progress(self):
        progress = TourProgress.objects.create(
            user=self.user,
            tour=self.tour,
            current_step=None,
            status=TourProgress.COMPLETED,
            completed_at=timezone.now(),
            total_xp=120,
            skip_count=3,
            wrong_attempt_count=2,
        )

        response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": self.tour.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], progress.id)

        progress.refresh_from_db()
        self.assertEqual(progress.status, TourProgress.IN_PROGRESS)
        self.assertEqual(progress.current_step_id, self.first_step.id)
        self.assertIsNone(progress.completed_at)
        self.assertEqual(progress.total_xp, 0)
        self.assertEqual(progress.skip_count, 0)
        self.assertEqual(progress.wrong_attempt_count, 0)

        self.assertEqual(
            TourProgress.objects.filter(user=self.user, tour=self.tour).count(),
            1,
        )

    def test_create_is_idempotent_for_same_in_progress_tour(self):
        progress = TourProgress.objects.create(
            user=self.user,
            tour=self.tour,
            current_step=self.first_step,
            status=TourProgress.IN_PROGRESS,
        )

        response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": self.tour.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], progress.id)

    def test_create_blocks_when_another_tour_is_in_progress(self):
        other_tour = Tour.objects.create(
            title="Other Tour",
            description="Other",
            creator=self.user,
            tour_type=Tour.STORY,
            category="Culture",
            difficulty=Tour.EASY,
            duration_minutes=10,
        )
        other_step = TourStep.objects.create(
            tour=other_tour,
            order=0,
            title="Only step",
            description="",
            latitude="2.0",
            longitude="2.0",
        )

        TourProgress.objects.create(
            user=self.user,
            tour=other_tour,
            current_step=other_step,
            status=TourProgress.IN_PROGRESS,
        )

        response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": self.tour.id},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["active_tour_id"], other_tour.id)
        self.assertIn("progress_id", response.data)
