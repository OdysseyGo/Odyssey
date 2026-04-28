from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour
from apps.tours.utils import normalize_tour_country

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
        self.assertEqual(tour.steps.count(), 2)
        step1 = tour.steps.get(order=0)
        self.assertEqual(step1.title, "Eiffel Tower")

    def test_create_tour_canonicalizes_country_from_country_code(self):
        canonical_country, canonical_country_code = normalize_tour_country(
            country="Fransa",
            country_code="fr",
        )
        response = self.client.post(
            "/api/tours/",
            {
                "title": "Localized Country Tour",
                "description": "Country should be canonicalized.",
                "tour_type": "STORY",
                "category": "History",
                "difficulty": "EASY",
                "duration_minutes": 45,
                "city": "Paris",
                "country": "Fransa",
                "country_code": "fr",
                "status": "DRAFT",
                "is_premium": False,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tour = Tour.objects.get(pk=response.data["id"])
        self.assertEqual(tour.country, canonical_country)
        self.assertEqual(tour.country_code, canonical_country_code)

    def test_update_tour_keeps_country_canonical_when_country_code_exists(self):
        tour = Tour.objects.create(
            title="Draft Tour",
            description="desc",
            creator=self.user,
            tour_type="STORY",
            category="History",
            difficulty="EASY",
            duration_minutes=30,
            city="Paris",
            country="France",
            country_code="FR",
            status=Tour.DRAFT,
            is_premium=False,
        )
        canonical_country, canonical_country_code = normalize_tour_country(
            country="Fransa",
            country_code="FR",
        )

        response = self.client.patch(
            f"/api/tours/{tour.id}/",
            {"country": "Fransa"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tour.refresh_from_db()
        self.assertEqual(tour.country, canonical_country)
        self.assertEqual(tour.country_code, canonical_country_code)
