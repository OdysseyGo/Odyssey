from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import Puzzle, PuzzleAttempt, Tour, TourStep

User = get_user_model()


class OpenEndedAnswerFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="open_ended_solver", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Open Ended Puzzle Tour",
            description="Open ended solve flow",
            creator=self.user,
            tour_type=Tour.PUZZLE,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=20,
        )
        self.step_one = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="Question stop",
            description="Type the answer",
            latitude="1.0",
            longitude="1.0",
        )
        self.step_two = TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Next stop",
            description="Continue",
            latitude="1.1",
            longitude="1.1",
        )

        self.puzzle = Puzzle.objects.create(
            step=self.step_one,
            puzzle_type=Puzzle.OPEN_ENDED,
            question="Name the empire",
            options=None,
            correct_answer="Byzantine Empire",
            hint="Think Constantinople",
            xp_reward=25,
        )
        self.progress = TourProgress.objects.create(
            user=self.user,
            tour=self.tour,
            current_step=self.step_one,
            status=TourProgress.IN_PROGRESS,
        )

    def test_complete_step_requires_open_ended_submission(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submit-open-ended-answer", response.data["error"])

    def test_submit_similar_open_ended_answer_allows_completion(self):
        submit_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-open-ended-answer/",
            {"answer": "byzantine empire"},
            format="json",
        )
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        self.assertTrue(submit_response.data["accepted"])
        self.assertGreaterEqual(submit_response.data["similarity_score"], 0.8)

        complete_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["new_step_id"], self.step_two.id)

    def test_three_wrong_attempts_exhaust_open_ended_and_increment_mistake_once(self):
        for expected_attempt_count in (1, 2, 3):
            response = self.client.post(
                f"/api/tour-progress/{self.progress.id}/submit-open-ended-answer/",
                {"answer": f"wrong {expected_attempt_count}"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertFalse(response.data["accepted"])
            self.assertEqual(response.data["attempt_count"], expected_attempt_count)

        blocked_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-open-ended-answer/",
            {"answer": "still wrong"},
            format="json",
        )
        self.assertEqual(blocked_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(blocked_response.data["accepted"])
        self.assertEqual(blocked_response.data["attempt_count"], 3)

        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_one.id)
        self.assertEqual(self.progress.wrong_attempt_count, 1)
        self.assertEqual(
            PuzzleAttempt.objects.filter(
                progress=self.progress, puzzle=self.puzzle, accepted=False
            ).count(),
            3,
        )

    def test_exhausted_open_ended_step_can_be_skipped(self):
        for _ in range(3):
            self.client.post(
                f"/api/tour-progress/{self.progress.id}/submit-open-ended-answer/",
                {"answer": "incorrect"},
                format="json",
            )

        skip_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/skip-step/", format="json"
        )
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)
        self.assertEqual(skip_response.data["new_step_id"], self.step_two.id)

        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_two.id)
        self.assertEqual(self.progress.total_xp, 0)
