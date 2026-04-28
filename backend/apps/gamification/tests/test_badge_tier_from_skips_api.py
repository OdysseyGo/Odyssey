from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import UserBadge
from apps.gamification.services import BadgeService
from apps.tours.models import Tour, TourStep

User = get_user_model()


class BadgeTierFromSkipsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="skip_badge_user", password="password"
        )
        self.creator = User.objects.create_user(
            username="skip_badge_creator", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Skip Badge Tour",
            description="Badge tier test",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=15,
            city="Ankara",
            country_code="TR",
        )
        for i in range(3):
            TourStep.objects.create(
                tour=self.tour,
                order=i,
                title=f"Step {i + 1}",
                description="",
                latitude=str(39.9 + i * 0.001),
                longitude=str(32.8 + i * 0.001),
            )

    def test_all_skipped_steps_award_no_city_badge(self):
        create_response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": self.tour.id},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        progress_id = create_response.data["id"]

        for _ in range(3):
            skip_response = self.client.post(
                f"/api/tour-progress/{progress_id}/skip-step/",
                format="json",
            )
            self.assertEqual(skip_response.status_code, status.HTTP_200_OK)

        badge = UserBadge.objects.filter(
            user=self.user,
            city="Ankara",
            country_code="TR",
        ).first()

        self.assertIsNone(badge)
