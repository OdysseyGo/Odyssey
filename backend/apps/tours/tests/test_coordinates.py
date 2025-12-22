from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour, TourStep

User = get_user_model()


class TourCoordinateTests(APITestCase):
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

    def test_create_step_high_precision_coordinates(self):
        # Coordinates with many decimal places
        step_data = {
            "title": "Precision Stop",
            "description": "",
            "latitude": "48.123456789",
            "longitude": "-122.123456789",
            "order": 0,
        }

        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/", step_data, format="json"
        )

        if response.status_code != status.HTTP_201_CREATED:
            print("\nCoordinate Error:", response.data)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        step = TourStep.objects.get(order=0)
        # Should be saved with high precision
        self.assertAlmostEqual(float(step.latitude), 48.123456789, places=6)
