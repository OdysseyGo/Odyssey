from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import Tour, TourStep

User = get_user_model()


class CompletionBadgeResponseTests(APITestCase):
    def test_complete_step_returns_awarded_city_badge_details(self):
        creator = User.objects.create_user(username="creator", password="password")
        user = User.objects.create_user(username="finisher", password="password")
        tour = Tour.objects.create(
            title="Paris Walk",
            description="A badge-earning tour",
            creator=creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=20,
            city="Paris",
            country="France",
            country_code="FR",
        )
        step = TourStep.objects.create(
            tour=tour,
            order=0,
            title="Final stop",
            latitude="48.8566",
            longitude="2.3522",
        )
        progress = TourProgress.objects.create(
            user=user,
            tour=tour,
            current_step=step,
            status=TourProgress.IN_PROGRESS,
        )

        self.client.force_authenticate(user=user)
        response = self.client.post(f"/api/tour-progress/{progress.id}/complete-step/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_tour_complete"])
        self.assertEqual(len(response.data["awarded_badges"]), 1)
        awarded_badge = response.data["awarded_badges"][0]
        self.assertEqual(awarded_badge["badge"]["code"], "CITY_GOLD")
        self.assertEqual(awarded_badge["city"], "Paris")
        self.assertEqual(awarded_badge["country_code"], "FR")
        self.assertEqual(awarded_badge["source_tour"], tour.id)
        self.assertEqual(awarded_badge["source_tour_detail"]["title"], "Paris Walk")

        history_response = self.client.get("/api/my-badge-history/")
        self.assertEqual(history_response.status_code, status.HTTP_200_OK)
        self.assertEqual(history_response.data["count"], 1)
        self.assertEqual(history_response.data["results"][0]["source_tour"], tour.id)
        self.assertEqual(
            history_response.data["results"][0]["source_tour_detail"]["title"],
            "Paris Walk",
        )
