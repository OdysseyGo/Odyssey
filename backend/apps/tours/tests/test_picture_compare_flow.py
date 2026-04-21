from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image, ImageDraw
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import PictureComparePuzzleDetail, Puzzle, PuzzleAttempt, Tour, TourStep

User = get_user_model()


class PictureCompareFlowTests(APITestCase):
    def _image_file(self, image, name):
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        buffer.seek(0)
        return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")

    def _reference_image(self):
        image = Image.new("RGB", (180, 180), color=(32, 48, 64))
        draw = ImageDraw.Draw(image)
        draw.rectangle((30, 30, 150, 150), outline=(240, 240, 240), width=5)
        draw.line((30, 30, 150, 150), fill=(255, 128, 80), width=4)
        draw.ellipse((70, 60, 120, 110), outline=(80, 220, 120), width=4)
        return image

    def _shifted_attempt_image(self):
        base = self._reference_image()
        shifted = Image.new("RGB", base.size, color=(20, 20, 20))
        shifted.paste(base.crop((0, 0, 174, 174)), (6, 6))
        return shifted

    def _mismatch_image(self):
        image = Image.new("RGB", (180, 180), color=(180, 25, 25))
        draw = ImageDraw.Draw(image)
        draw.rectangle((20, 20, 160, 60), fill=(255, 255, 255))
        draw.rectangle((20, 120, 160, 160), fill=(0, 0, 0))
        return image

    def setUp(self):
        self.user = User.objects.create_user(username="pc_user", password="password")
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Picture Compare Tour",
            description="Puzzle tour",
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
            description="Match the hidden marker",
            latitude="1.0",
            longitude="1.0",
        )
        self.step_two = TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Next location",
            description="Continue tour",
            latitude="1.1",
            longitude="1.1",
        )

        self.puzzle = Puzzle.objects.create(
            step=self.step_one,
            puzzle_type=Puzzle.PICTURE_COMPARE,
            question="Match this marker",
            correct_answer="PICTURE_COMPARE",
            hint="Look near the entrance",
            xp_reward=25,
        )
        PictureComparePuzzleDetail.objects.create(
            puzzle=self.puzzle,
            reference_image=self._image_file(self._reference_image(), "reference.jpg"),
            similarity_threshold=0.7,
        )

        self.progress = TourProgress.objects.create(
            user=self.user,
            tour=self.tour,
            current_step=self.step_one,
            status=TourProgress.IN_PROGRESS,
        )

    def test_complete_step_requires_picture_compare_submission(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/complete-step/", format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_submit_picture_compare_accepts_shifted_match_without_advancing(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-picture-compare/",
            {"image": self._image_file(self._shifted_attempt_image(), "attempt.jpg")},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["accepted"])

        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_one.id)
        self.assertEqual(PuzzleAttempt.objects.filter(progress=self.progress).count(), 1)

    def test_submit_picture_compare_mismatch_does_not_advance(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress.id}/submit-picture-compare/",
            {"image": self._image_file(self._mismatch_image(), "bad_attempt.jpg")},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["accepted"])
        self.progress.refresh_from_db()
        self.assertEqual(self.progress.current_step_id, self.step_one.id)
