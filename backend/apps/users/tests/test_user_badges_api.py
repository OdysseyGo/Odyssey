from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import Badge, UserBadge

User = get_user_model()


class UserBadgesApiTests(APITestCase):
    def test_user_badges_returns_badges_for_requested_profile(self):
        viewer = User.objects.create_user(username="viewer", password="password")
        target = User.objects.create_user(username="target", password="password")
        other = User.objects.create_user(username="other", password="password")
        target_badge = Badge.objects.create(
            code="CITY_GOLD",
            name="Gold Explorer",
            description="Completed a city perfectly",
            criteria={},
        )
        other_badge = Badge.objects.create(
            code="XP_100",
            name="XP Starter",
            description="Earned starter XP",
            criteria={},
        )
        UserBadge.objects.create(
            user=target,
            badge=target_badge,
            city="Paris",
            country_code="FR",
        )
        UserBadge.objects.create(
            user=other,
            badge=other_badge,
            city="Istanbul",
            country_code="TR",
        )

        self.client.force_authenticate(user=viewer)
        response = self.client.get(f"/api/users/{target.id}/badges/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["user"], target.id)
        self.assertEqual(response.data["results"][0]["badge"]["code"], "CITY_GOLD")
        self.assertEqual(response.data["results"][0]["city"], "Paris")
