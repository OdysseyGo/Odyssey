from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour

User = get_user_model()


class TourImageEdgeCaseTests(APITestCase):
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

    def test_create_step_with_empty_string_image(self):
        # Frontend might send image: ""
        step_data = {
            "title": "Stop 1",
            "description": "Valid Step",
            "latitude": "1.0",
            "longitude": "1.0",
            "order": 0,
            "image": "",  # Empty string
        }

        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/", step_data, format="json"
        )

        # We want to know if this passes or fails
        if response.status_code != status.HTTP_201_CREATED:
            print("\nEmpty String Image Error:", response.data)

        # DRF behavior for ImageField="" depends on configuration.
        # Ideally we want this to be accepted as null, or we fix frontend to not send it.
        # This test ensures we know the behavior.
