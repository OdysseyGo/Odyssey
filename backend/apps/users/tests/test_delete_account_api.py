import shutil
import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.notifications.models import Notification
from apps.tours.models import PictureComparePuzzleDetail, Puzzle, Review, Tour, TourStep
from apps.users.models import Follow, SearchHistory

User = get_user_model()


class DeleteMyAccountApiTests(APITestCase):
    def setUp(self):
        super().setUp()
        self._temp_media_dir = tempfile.mkdtemp(prefix="odyssey-test-media-")
        self._media_override = override_settings(MEDIA_ROOT=self._temp_media_dir)
        self._media_override.enable()

    def tearDown(self):
        self._media_override.disable()
        shutil.rmtree(self._temp_media_dir, ignore_errors=True)
        super().tearDown()

    @staticmethod
    def _uploaded_file(name: str, content: bytes) -> SimpleUploadedFile:
        return SimpleUploadedFile(name=name, content=content)

    def test_delete_me_requires_authentication(self):
        response = self.client.delete("/api/users/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_me_removes_user_related_data_and_user_owned_media_files(self):
        owner = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="password123",
        )
        other = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="password123",
        )

        tour = Tour.objects.create(
            title="Owner Tour",
            description="A tour that will be deleted",
            creator=owner,
            tour_type=Tour.STORY,
            category="History",
            duration_minutes=35,
            cover_image=self._uploaded_file("cover.jpg", b"cover-image-content"),
        )
        step = TourStep.objects.create(
            tour=tour,
            order=1,
            title="Stop 1",
            latitude="41.0082",
            longitude="28.9784",
            image=self._uploaded_file("step.jpg", b"step-image-content"),
            audio=self._uploaded_file("step.mp3", b"step-audio-content"),
        )
        picture_compare_puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.PICTURE_COMPARE,
            question="What changed?",
            correct_answer="A",
            reference_image=self._uploaded_file("puzzle.jpg", b"puzzle-image-content"),
        )
        picture_compare_detail = PictureComparePuzzleDetail.objects.create(
            puzzle=picture_compare_puzzle,
            reference_image=self._uploaded_file(
                "puzzle-detail.jpg", b"detail-image-content"
            ),
        )

        Review.objects.create(
            tour=tour,
            user=other,
            rating=5,
            comment="Great tour",
        )
        TourProgress.objects.create(user=owner, tour=tour)
        Follow.objects.create(follower=owner, following=other)
        Follow.objects.create(follower=other, following=owner)
        SearchHistory.objects.create(
            user=owner, search_type=SearchHistory.TOURS, query="paris"
        )
        Notification.objects.create(user=owner, title="Hi", body="Hello")

        media_files = [
            (tour.cover_image.storage, tour.cover_image.name),
            (step.image.storage, step.image.name),
            (step.audio.storage, step.audio.name),
            (
                picture_compare_puzzle.reference_image.storage,
                picture_compare_puzzle.reference_image.name,
            ),
            (
                picture_compare_detail.reference_image.storage,
                picture_compare_detail.reference_image.name,
            ),
        ]
        for storage, name in media_files:
            self.assertTrue(storage.exists(name))

        self.client.force_authenticate(user=owner)
        response = self.client.delete("/api/users/me/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=owner.id).exists())
        self.assertTrue(User.objects.filter(id=other.id).exists())

        self.assertFalse(Tour.objects.filter(id=tour.id).exists())
        self.assertFalse(TourStep.objects.filter(id=step.id).exists())
        self.assertFalse(Puzzle.objects.filter(id=picture_compare_puzzle.id).exists())
        self.assertFalse(
            PictureComparePuzzleDetail.objects.filter(
                id=picture_compare_detail.id
            ).exists()
        )
        self.assertFalse(Review.objects.filter(tour_id=tour.id).exists())
        self.assertFalse(TourProgress.objects.filter(user_id=owner.id).exists())
        self.assertFalse(
            Follow.objects.filter(follower_id=owner.id).exists()
            or Follow.objects.filter(following_id=owner.id).exists()
        )
        self.assertFalse(SearchHistory.objects.filter(user_id=owner.id).exists())
        self.assertFalse(Notification.objects.filter(user_id=owner.id).exists())

        for storage, name in media_files:
            self.assertFalse(storage.exists(name))
