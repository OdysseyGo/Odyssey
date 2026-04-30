from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import (
    ARModel,
    ArPuzzleDetail,
    CompassPuzzleDetail,
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

    def _glb_file(self, name="model.glb"):
        return SimpleUploadedFile(
            name,
            b"glTF\x02\x00\x00\x00mock-binary-payload",
            content_type="model/gltf-binary",
        )

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
        self.ar_model = ARModel.objects.create(
            slug="bronze-statue",
            name="Bronze Statue",
            preview_image=self._image_file("statue-preview.jpg"),
            scene_asset_file=self._glb_file("statue.glb"),
            anchors=[
                {
                    "id": "head",
                    "label": "Head",
                    "position": {"x": 0.0, "y": 1.2, "z": -1.0},
                },
                {
                    "id": "left-hand",
                    "label": "Left Hand",
                    "position": {"x": -0.2, "y": 0.8, "z": -1.0},
                },
            ],
            is_active=True,
            sort_order=1,
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
                "metadata": {
                    "model_id": self.ar_model.id,
                    "anchor_id": "head",
                    "placement_mode": "anchor",
                    "secret_code": "Code77",
                    "model_scale_meters": 1.75,
                },
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["puzzle_type"], Puzzle.AR)
        self.assertTrue(response.data["ar"]["scene_asset_url"].endswith(".glb"))

        puzzle = Puzzle.objects.get(step=self.step)
        detail = ArPuzzleDetail.objects.get(puzzle=puzzle)
        self.assertEqual(detail.metadata["model_id"], self.ar_model.id)
        self.assertEqual(detail.metadata["anchor_id"], "head")
        self.assertEqual(detail.metadata["placement_mode"], "anchor")
        self.assertEqual(detail.metadata["secret_code"], "Code77")
        self.assertEqual(detail.metadata["model_scale_meters"], 1.75)
        self.assertEqual(
            detail.metadata["anchor_position"],
            {"x": 0.0, "y": 1.2, "z": -1.0},
        )

    def test_set_ar_puzzle_rejects_invalid_secret_code(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-ar-puzzle/",
            {
                "question": "Find the hidden object",
                "hint": "Look up",
                "xp_reward": 20,
                "metadata": {
                    "model_id": self.ar_model.id,
                    "anchor_id": "head",
                    "placement_mode": "anchor",
                    "secret_code": "??",
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_set_ar_puzzle_rejects_invalid_model_scale(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-ar-puzzle/",
            {
                "question": "Find the hidden object",
                "hint": "Look up",
                "xp_reward": 20,
                "metadata": {
                    "model_id": self.ar_model.id,
                    "anchor_id": "head",
                    "placement_mode": "anchor",
                    "secret_code": "Code77",
                    "model_scale_meters": 12,
                },
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_ar_model_catalog_lists_active_items(self):
        ARModel.objects.create(
            slug="inactive-model",
            name="Inactive Model",
            preview_image_url="https://example.com/inactive-preview.jpg",
            scene_asset_url="https://example.com/inactive.glb",
            anchors=[],
            is_active=False,
            sort_order=0,
        )
        response = self.client.get("/api/tours/ar-models/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.ar_model.id)
        self.assertTrue(response.data[0]["preview_image_url"].endswith(".jpg"))
        self.assertTrue(response.data[0]["scene_asset_url"].endswith(".glb"))

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

    def test_set_compass_puzzle_creates_compass_detail(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-compass-puzzle/",
            {
                "question": "Face north-west target",
                "hint": "Rotate slowly",
                "xp_reward": 20,
                "target_heading_degrees": 238,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["puzzle_type"], Puzzle.COMPASS)
        self.assertEqual(response.data["compass"]["target_heading_degrees"], 238)

        puzzle = Puzzle.objects.get(step=self.step)
        detail = CompassPuzzleDetail.objects.get(puzzle=puzzle)
        self.assertEqual(detail.target_heading_degrees, 238)

    def test_set_compass_puzzle_rejects_out_of_range_heading(self):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-compass-puzzle/",
            {
                "question": "Face north-west target",
                "hint": "Rotate slowly",
                "xp_reward": 20,
                "target_heading_degrees": 360,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_switching_from_compass_to_trivia_clears_compass_detail(self):
        self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-compass-puzzle/",
            {
                "question": "Face north-west target",
                "hint": "Rotate slowly",
                "xp_reward": 20,
                "target_heading_degrees": 238,
            },
            format="json",
        )

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
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        puzzle = Puzzle.objects.get(step=self.step)
        self.assertFalse(
            CompassPuzzleDetail.objects.filter(puzzle=puzzle).exists(),
            "Switching puzzle type should remove stale COMPASS detail rows.",
        )
