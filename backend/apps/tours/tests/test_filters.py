from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour, TourStep

User = get_user_model()


class TourFilterApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="filter-user",
            email="filter@example.com",
            password="testpassword123",
        )

        self.europe_tour = Tour.objects.create(
            title="Paris Highlights",
            description="A walk through Paris",
            creator=self.user,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Paris",
            country="France",
            country_code="FR",
            status=Tour.PUBLISHED,
            is_premium=False,
        )
        TourStep.objects.create(
            tour=self.europe_tour,
            order=0,
            title="Eiffel Tower",
            description="Start here",
            latitude="48.8584",
            longitude="2.2945",
        )

        self.asia_tour = Tour.objects.create(
            title="Tokyo Nights",
            description="A walk through Tokyo",
            creator=self.user,
            tour_type=Tour.STORY,
            category="Food",
            difficulty=Tour.MEDIUM,
            duration_minutes=90,
            city="Tokyo",
            country="Japan",
            country_code="JP",
            status=Tour.PUBLISHED,
            is_premium=False,
        )
        TourStep.objects.create(
            tour=self.asia_tour,
            order=0,
            title="Shibuya Crossing",
            description="Start here",
            latitude="35.6595",
            longitude="139.7005",
        )

    def test_list_tours_filters_by_continent(self):
        response = self.client.get("/api/tours/?continent=Europe")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [tour["id"] for tour in response.data["results"]]
        self.assertEqual(returned_ids, [self.europe_tour.id])

    def test_list_tours_combines_category_and_continent_filters(self):
        response = self.client.get("/api/tours/?continent=Europe&category=History")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = [tour["id"] for tour in response.data["results"]]
        self.assertEqual(returned_ids, [self.europe_tour.id])
