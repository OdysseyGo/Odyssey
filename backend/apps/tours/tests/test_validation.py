from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour

User = get_user_model()


class TourValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="password")
        self.client.force_authenticate(user=self.user)

    def test_create_tour_missing_fields(self):
        # Test empty category
        tour_data = {
            "title": "Tour",
            "description": "Desc",
            "tour_type": "STORY",
            "category": "",  # Empty category
            "difficulty": "EASY",
            "duration_minutes": 60,
        }
        response = self.client.post("/api/tours/", tour_data, format="json")
        print("\nEmpty Category Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_step_almost_empty_fields(self):
        # Create valid tour first
        tour = Tour.objects.create(
            title="T",
            description="D",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=60,
        )

        # Test empty description (Should Pass now) but empty title (Should Fail)
        step_data = {
            "title": "",
            "description": "",  # Empty description allowed
            "latitude": "1.0",
            "longitude": "1.0",
            "order": 0,
        }
        response = self.client.post(
            f"/api/tours/{tour.id}/steps/", step_data, format="json"
        )
        print("\nEmpty Title Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("title", response.data)
        self.assertNotIn("description", response.data)  # Description should be fine

    def test_create_step_valid_empty_description(self):
        # Create valid tour first
        tour = Tour.objects.create(
            title="T",
            description="D",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=60,
        )

        # Test valid step with empty description
        step_data = {
            "title": "Valid Title",
            "description": "",
            "latitude": "1.0",
            "longitude": "1.0",
            "order": 0,
        }
        response = self.client.post(
            f"/api/tours/{tour.id}/steps/", step_data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
