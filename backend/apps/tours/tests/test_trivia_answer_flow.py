from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import Puzzle, PuzzleAttempt, Tour, TourStep, TriviaPuzzleDetail

User = get_user_model()


class TriviaAnswerFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="trivia_solver", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Trivia Puzzle Tour",
            description="Trivia solve flow",
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
            description="Answer the trivia",
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
            puzzle_type=Puzzle.TRIVIA,
            question="Which empire built this?",
            options=["Roman", "Ottoman", "Byzantine"],
            correct_answer="Byzantine",
            hint="Look at the dome",
            xp_reward=25,
        )
        TriviaPuzzleDetail.objects.create(
            puzzle=self.puzzle,
            options=["Roman", "Ottoman", "Byzantine"],
            correct_answer="Byzantine",
        )

        self.progress = TourProgress.objects.create(
            user=self.user,
            tour=self.tour,
            current_step=self.step_one,
            status=TourProgress.IN_PROGRESS,
        )

    def test_submit_wrong_trivia_answer_records_attempt_without_advancing(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-trivia-answer/",
            {"answer": "Roman"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["accepted"])
        self.assertEqual(response.data["attempt_count"], 1)

        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_one.id)
        self.assertEqual(self.progress.wrong_attempt_count, 1)
        self.assertEqual(
            PuzzleAttempt.objects.filter(
                progress=self.progress, puzzle=self.puzzle, accepted=False
            ).count(),
            1,
        )

    def test_wrong_trivia_answer_consumes_only_attempt_and_can_be_skipped(self):
        self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-trivia-answer/",
            {"answer": "Roman"},
            format="json",
        )

        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-trivia-answer/",
            {"answer": "byzantine"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["accepted"])
        self.assertEqual(response.data["attempt_count"], 1)

        complete_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )
        self.assertEqual(complete_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submit-trivia-answer", complete_response.data["error"])

        skip_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/skip-step/", format="json"
        )
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)
        self.assertEqual(skip_response.data["new_step_id"], self.step_two.id)

        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_two.id)
        self.assertEqual(self.progress.wrong_attempt_count, 1)
        self.assertEqual(self.progress.total_xp, 0)

    def test_correct_trivia_answer_can_complete_current_step(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-trivia-answer/",
            {"answer": "byzantine"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["new_step_id"], self.step_two.id)

        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_two.id)
        self.assertEqual(self.progress.wrong_attempt_count, 0)
        self.assertEqual(self.progress.total_xp, 25)

    def test_complete_step_requires_correct_trivia_submission(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submit-trivia-answer", response.data["error"])

    def test_progress_serializer_includes_failed_trivia_attempt_counts(self):
        self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-trivia-answer/",
            {"answer": "Ottoman"},
            format="json",
        )

        response = self.client.get(f"/api/tour-progress/{self.progress.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["step_attempt_counts"], {str(self.step_one.id): 1}
        )
