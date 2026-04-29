from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour, TourStep

User = get_user_model()


class TourImageTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.client.force_authenticate(user=self.user)
        self.tour = Tour.objects.create(
            title="T",
            description="D",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=60,
        )

    def test_create_step_with_valid_image(self):
        from django.core.files.uploadedfile import SimpleUploadedFile

        # valid 1x1 GIF
        image_content = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x05\x04\x04"
            b"\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44"
            b"\x01\x00\x3b"
        )
        image = SimpleUploadedFile(
            "test_image.gif", image_content, content_type="image/gif"
        )

        step_data = {
            "title": "Stop 1",
            "description": "Valid Step",
            "latitude": "1.0",
            "longitude": "1.0",
            "order": 0,
            "image": image,
        }

        # Format must be multipart for file upload
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/", step_data, format="multipart"
        )

        if response.status_code != status.HTTP_201_CREATED:
            print("\nMultipart Upload Error:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(TourStep.objects.filter(image__contains="test_image").exists())
