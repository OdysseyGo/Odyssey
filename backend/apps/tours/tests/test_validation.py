from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour, TourStep

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
        self.assertIn("category", response.data)

    def test_publish_tour_requires_cover_image(self):
        tour = Tour.objects.create(
            title="Draft Tour",
            description="D",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=60,
            city="Paris",
            country="France",
            country_code="FR",
            status=Tour.DRAFT,
        )

        response = self.client.patch(
            f"/api/tours/{tour.id}/",
            {
                "status": Tour.PUBLISHED,
                "city_latitude": 48.8566,
                "city_longitude": 2.3522,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cover_image", response.data)

    def test_publish_tour_requires_cover_image_file(self):
        tour = Tour.objects.create(
            title="AI Draft Tour",
            description="D",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=60,
            city="Paris",
            country="France",
            country_code="FR",
            status=Tour.DRAFT,
        )
        self.client.post(
            f"/api/tours/{tour.id}/steps/",
            {
                "title": "Stop 1",
                "description": "",
                "latitude": "48.8584",
                "longitude": "2.2945",
                "order": 0,
            },
            format="json",
        )

        with patch(
            "apps.tours.api.serializers.GoogleMapsFacade.tour_has_step_in_city",
            return_value=True,
        ):
            response = self.client.patch(
                f"/api/tours/{tour.id}/",
                {
                    "status": Tour.PUBLISHED,
                    "city_latitude": 48.8566,
                    "city_longitude": 2.3522,
                },
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cover_image", response.data)

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

    def test_create_step_rejects_when_step_limit_reached(self):
        tour = Tour.objects.create(
            title="Step Limit Tour",
            description="D",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=60,
        )

        TourStep.objects.bulk_create(
            [
                TourStep(
                    tour=tour,
                    order=i,
                    title=f"Stop {i + 1}",
                    description="",
                    latitude="1.0",
                    longitude="1.0",
                )
                for i in range(150)
            ]
        )

        response = self.client.post(
            f"/api/tours/{tour.id}/steps/",
            {
                "title": "Overflow Stop",
                "description": "",
                "latitude": "1.0",
                "longitude": "1.0",
                "order": 150,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("steps", response.data)
