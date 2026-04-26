from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import ArPuzzleDetail, Puzzle, Tour, TourStep

User = get_user_model()


class ARPuzzleSolveFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ar_solver", password="password")
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="AR Puzzle Tour",
            description="AR solve flow",
            creator=self.user,
            tour_type=Tour.PUZZLE,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=20,
        )
        self.step_one = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="Find the marker",
            description="Spot the hidden code",
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
            puzzle_type=Puzzle.AR,
            question="Find and enter the hidden code",
            correct_answer="",
            hint="Open AR view",
            xp_reward=25,
        )
        ArPuzzleDetail.objects.create(
            puzzle=self.puzzle,
            scene_asset_url="https://example.com/model.glb",
            metadata={
                "model_id": 1,
                "anchor_id": "head",
                "placement_mode": "anchor",
                "secret_code": "Code77",
                "model_scale_meters": 1.0,
                "anchor_position": {"x": 0.0, "y": 1.0, "z": -1.0},
            },
        )

        self.progress = TourProgress.objects.create(
            user=self.user,
            tour=self.tour,
            current_step=self.step_one,
            status=TourProgress.IN_PROGRESS,
        )

    def test_complete_step_requires_ar_code_submission(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submit-ar-code", response.data["error"])

    def test_submit_ar_code_accepts_case_insensitive_then_allows_completion(self):
        submit_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-ar-code/",
            {"code": "code77"},
            format="json",
        )
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        self.assertTrue(submit_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["new_step_id"], self.step_two.id)

    def test_submit_ar_code_wrong_value_keeps_step_locked(self):
        submit_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-ar-code/",
            {"code": "wrong"},
            format="json",
        )
        self.assertEqual(submit_response.status_code, status.HTTP_200_OK)
        self.assertFalse(submit_response.data["accepted"])

        complete_response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )
        self.assertEqual(complete_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submit-ar-code", complete_response.data["error"])
