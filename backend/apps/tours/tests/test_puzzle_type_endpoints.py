from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import (
    ArPuzzleDetail,
    GyroscopePuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)

User = get_user_model()


class PuzzleTypeEndpointTests(APITestCase):
    def _image_file(self, name="reference.jpg"):
        image = Image.new("RGB", (120, 120), color=(20, 60, 120))
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        buffer.seek(0)
        return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")

    def setUp(self):
        self.user = User.objects.create_user(
            username="puzzle_owner", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Puzzle Endpoint Tour",
            description="Test dedicated puzzle endpoints",
            creator=self.user,
            tour_type=Tour.PUZZLE,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=20,
        )
        self.step = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="Step",
            description="",
            latitude="1.0",
            longitude="1.0",
        )

    def test_set_trivia_puzzle_creates_trivia_detail(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-trivia-puzzle/",
            {
                "question": "Which one is correct?",
                "hint": "Pick A",
                "xp_reward": 15,
                "options": ["A", "B", "C"],
                "correct_answer": "A",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["puzzle_type"], Puzzle.TRIVIA)
        self.assertIn("trivia", response.data)
        self.assertEqual(response.data["trivia"]["correct_answer"], "A")

        puzzle = Puzzle.objects.get(step=self.step)
        detail = TriviaPuzzleDetail.objects.get(puzzle=puzzle)
        self.assertEqual(detail.options, ["A", "B", "C"])
        self.assertEqual(detail.correct_answer, "A")

    def test_set_picture_compare_puzzle_creates_detail_with_threshold(self):
        self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-trivia-puzzle/",
            {
                "question": "Which one is correct?",
                "hint": "Pick A",
                "xp_reward": 10,
                "options": ["A", "B"],
                "correct_answer": "A",
            },
            format="json",
        )

        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-picture-compare-puzzle/",
            {
                "question": "Match this image",
                "hint": "Use camera",
                "xp_reward": 30,
                "similarity_threshold": 0.82,
                "reference_image": self._image_file(),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["puzzle_type"], Puzzle.PICTURE_COMPARE)
        self.assertIn("picture_compare", response.data)
        self.assertEqual(response.data["picture_compare"]["similarity_threshold"], 0.82)

        puzzle = Puzzle.objects.get(step=self.step)
        detail = PictureComparePuzzleDetail.objects.get(puzzle=puzzle)
        self.assertAlmostEqual(detail.similarity_threshold, 0.82)
        self.assertTrue(bool(detail.reference_image))

        self.assertFalse(
            TriviaPuzzleDetail.objects.filter(puzzle=puzzle).exists(),
            "Switching puzzle type should remove stale TRIVIA detail rows.",
        )

    def test_set_ar_puzzle_creates_ar_detail(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-ar-puzzle/",
            {
                "question": "Find the hidden object",
                "hint": "Look up",
                "xp_reward": 20,
                "scene_asset_url": "https://example.com/scene.glb",
                "metadata": {"target": "statue"},
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["puzzle_type"], Puzzle.AR)
        self.assertEqual(
            response.data["ar"]["scene_asset_url"], "https://example.com/scene.glb"
        )

        puzzle = Puzzle.objects.get(step=self.step)
        detail = ArPuzzleDetail.objects.get(puzzle=puzzle)
        self.assertEqual(detail.metadata, {"target": "statue"})

    def test_set_gyroscope_puzzle_creates_gyroscope_detail(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-gyroscope-puzzle/",
            {
                "question": "Face the marker",
                "hint": "Turn slowly",
                "xp_reward": 18,
                "target_pitch": 1.5,
                "target_roll": 2.5,
                "target_yaw": 90.0,
                "tolerance_degrees": 12.0,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["puzzle_type"], Puzzle.GYROSCOPE)
        self.assertEqual(response.data["gyroscope"]["target_yaw"], 90.0)

        puzzle = Puzzle.objects.get(step=self.step)
        detail = GyroscopePuzzleDetail.objects.get(puzzle=puzzle)
        self.assertEqual(detail.tolerance_degrees, 12.0)
