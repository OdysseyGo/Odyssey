from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import Tour, TourStep

User = get_user_model()


class TourCreationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)

    def test_create_tour_and_steps_flow(self):
        # 1. Create Tour
        tour_data = {
            "title": "My Awesome Tour",
            "description": "A tour about awesomeness",
            "tour_type": "STORY",
            "category": "History",
            "difficulty": "EASY",
            "duration_minutes": 60,
            "city": "Paris",
            "country": "France",
            "country_code": "FR",
            "status": "DRAFT",
            "is_premium": False,
        }
        response = self.client.post("/api/tours/", tour_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tour_id = response.data["id"]
        self.assertEqual(response.data["creator"]["id"], self.user.id)

        # 2. Create Tour Steps
        step1_data = {
            "title": "Eiffel Tower",
            "description": "The Iron Lady",
            "latitude": "48.8584",
            "longitude": "2.2945",
            "order": 0,
        }
        response_step1 = self.client.post(
            f"/api/tours/{tour_id}/steps/", step1_data, format="json"
        )
        self.assertEqual(response_step1.status_code, status.HTTP_201_CREATED)

        step2_data = {
            "title": "Louvre Museum",
            "description": "Home of Mona Lisa",
            "latitude": "48.8606",
            "longitude": "2.3376",
            "order": 1,
        }
        response_step2 = self.client.post(
            f"/api/tours/{tour_id}/steps/", step2_data, format="json"
        )
        self.assertEqual(response_step2.status_code, status.HTTP_201_CREATED)

        # 3. Publish after at least one stop is confirmed inside the selected city.
        with patch(
            "apps.tours.api.serializers.GoogleMapsFacade.tour_has_step_in_city",
            return_value=True,
        ):
            response_publish = self.client.patch(
                f"/api/tours/{tour_id}/",
                {
                    "status": "PUBLISHED",
                    "city_latitude": 48.8566,
                    "city_longitude": 2.3522,
                },
                format="json",
            )
        self.assertEqual(response_publish.status_code, status.HTTP_200_OK)

        # 4. Verify Data
        tour = Tour.objects.get(pk=tour_id)
        self.assertEqual(tour.status, Tour.PUBLISHED)
        self.assertFalse(tour.is_ai_generated)
        self.assertFalse(response.data["is_ai_generated"])
        self.assertEqual(tour.steps.count(), 2)
        step1 = tour.steps.get(order=0)
        self.assertEqual(step1.title, "Eiffel Tower")


class TourCompletionVisibilityApiTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="password123",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="password123",
        )
        self.tour = Tour.objects.create(
            title="AI Tour",
            description="AI generated tour",
            creator=self.creator,
            tour_type=Tour.PUZZLE,
            category="Mystery",
            difficulty=Tour.EASY,
            duration_minutes=20,
            is_ai_generated=True,
        )
        self.first_step = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="First",
            description="",
            latitude="1.0",
            longitude="1.0",
        )

    def test_user_has_completed_once_is_scoped_to_authenticated_user(self):
        TourProgress.objects.create(
            user=self.creator,
            tour=self.tour,
            current_step=None,
            status=TourProgress.IN_PROGRESS,
            has_completed_once=True,
        )

        self.client.force_authenticate(user=self.creator)
        response = self.client.get(f"/api/tours/{self.tour.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_ai_generated"])
        self.assertTrue(response.data["user_has_completed_once"])

        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/tours/{self.tour.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["user_has_completed_once"])

        self.client.force_authenticate(user=None)
        response = self.client.get(f"/api/tours/{self.tour.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["user_has_completed_once"])
