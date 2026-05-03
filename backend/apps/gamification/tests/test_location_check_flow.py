from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour, TourStep

User = get_user_model()


class LocationCheckFlowTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="location_check_user", password="password"
        )
        self.creator = User.objects.create_user(
            username="location_check_creator", password="password"
        )
        self.client.force_authenticate(user=self.user)

        self.tour = Tour.objects.create(
            title="Location Gate Tour",
            description="Tour with location gate",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=20,
            city="Istanbul",
            country_code="TR",
        )
        self.step_one = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="Start",
            description="",
            latitude="41.0082",
            longitude="28.9784",
        )
        self.step_two = TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Next",
            description="",
            latitude="41.0092",
            longitude="28.9794",
        )

        create_response = self.client.post(
            "/api/tour-progress/",
            {"tour_id": self.tour.id},
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.progress_id = create_response.data["id"]

    def test_complete_step_is_blocked_until_location_confirmed(self):
        blocked_response = self.client.post(
            f"/api/tour-progress/{self.progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(blocked_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(blocked_response.data["requires_location_confirmation"])

        check_response = self.client.post(
            f"/api/tour-progress/{self.progress_id}/check-location/",
            {
                "step_id": self.step_one.id,
                "latitude": 41.0082,
                "longitude": 28.9784,
            },
            format="json",
        )
        self.assertEqual(check_response.status_code, status.HTTP_200_OK)
        self.assertTrue(check_response.data["accepted"])
        self.assertEqual(check_response.data["radius_m"], 100)

        complete_response = self.client.post(
            f"/api/tour-progress/{self.progress_id}/complete-step/",
            format="json",
        )
        self.assertEqual(complete_response.status_code, status.HTTP_200_OK)
        self.assertEqual(complete_response.data["new_step_id"], self.step_two.id)

    def test_skip_step_is_allowed_without_location_confirmation(self):
        skip_response = self.client.post(
            f"/api/tour-progress/{self.progress_id}/skip-step/",
            format="json",
        )
        self.assertEqual(skip_response.status_code, status.HTTP_200_OK)
        self.assertEqual(skip_response.data["new_step_id"], self.step_two.id)

    def test_check_location_rejects_when_outside_radius(self):
        response = self.client.post(
            f"/api/tour-progress/{self.progress_id}/check-location/",
            {
                "step_id": self.step_one.id,
                "latitude": 41.0182,
                "longitude": 28.9884,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["accepted"])
        self.assertGreater(response.data["distance_m"], response.data["radius_m"])
