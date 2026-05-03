from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour, TourStep

User = get_user_model()


class TourEditDeleteReviewFlowTests(APITestCase):
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
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="password123",
            is_staff=True,
        )
        self.tour = Tour.objects.create(
            title="Published Tour",
            description="desc",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=30,
            city="Paris",
            country="France",
            country_code="FR",
            status=Tour.PUBLISHED,
            review_status=None,
            submission_type=Tour.CREATE,
        )
        self.step = TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Stop 1",
            description="",
            latitude="48.8584",
            longitude="2.2945",
        )

    def test_creator_can_request_edit_review(self):
        self.client.force_authenticate(user=self.creator)
        response = self.client.post(f"/api/tours/{self.tour.id}/request-edit/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.PENDING)
        self.assertEqual(self.tour.review_status, Tour.IN_REVIEW)
        self.assertEqual(self.tour.submission_type, Tour.EDIT)

    def test_creator_can_request_delete_review(self):
        self.client.force_authenticate(user=self.creator)
        response = self.client.post(f"/api/tours/{self.tour.id}/request-delete/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.PENDING)
        self.assertEqual(self.tour.review_status, Tour.IN_REVIEW)
        self.assertEqual(self.tour.submission_type, Tour.DELETE)

    def test_non_creator_cannot_request_edit_review(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(f"/api/tours/{self.tour.id}/request-edit/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_approve_edit_publishes_tour(self):
        self.tour.status = Tour.PENDING
        self.tour.review_status = Tour.IN_REVIEW
        self.tour.submission_type = Tour.EDIT
        self.tour.save(update_fields=["status", "review_status", "submission_type"])

        self.client.force_authenticate(user=self.admin)
        with patch(
            "apps.admin_dashboard.api.views.GoogleMapsFacade.tour_has_step_in_city",
            return_value=True,
        ):
            response = self.client.post(f"/api/admin/tours/{self.tour.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.PUBLISHED)
        self.assertIsNone(self.tour.review_status)
        self.assertEqual(self.tour.submission_type, Tour.CREATE)

    def test_admin_reject_delete_restores_published(self):
        self.tour.status = Tour.PENDING
        self.tour.review_status = Tour.IN_REVIEW
        self.tour.submission_type = Tour.DELETE
        self.tour.save(update_fields=["status", "review_status", "submission_type"])

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/admin/tours/{self.tour.id}/reject/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.PUBLISHED)
        self.assertIsNone(self.tour.review_status)
        self.assertEqual(self.tour.submission_type, Tour.CREATE)

    def test_admin_approve_delete_removes_tour(self):
        self.tour.status = Tour.PENDING
        self.tour.review_status = Tour.IN_REVIEW
        self.tour.submission_type = Tour.DELETE
        self.tour.save(update_fields=["status", "review_status", "submission_type"])

        self.client.force_authenticate(user=self.admin)
        response = self.client.post(f"/api/admin/tours/{self.tour.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Tour.objects.filter(id=self.tour.id).exists())

    def test_non_creator_cannot_mutate_tour_steps(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/",
            {"title": "Updated by other"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_open_ended_answer_is_included_for_creator_edit_payload_only(self):
        self.client.force_authenticate(user=self.creator)
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/{self.step.id}/set-open-ended-puzzle/",
            {
                "question": "Type the secret",
                "hint": "Starts with O",
                "correct_answer": "ODYSSEY",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        creator_view = self.client.get(f"/api/tours/{self.tour.id}/")
        self.assertEqual(creator_view.status_code, status.HTTP_200_OK)
        creator_puzzle = creator_view.data["steps"][0]["puzzle"]
        self.assertEqual(creator_puzzle["open_ended"]["correct_answer"], "ODYSSEY")

        self.client.force_authenticate(user=self.other_user)
        other_view = self.client.get(f"/api/tours/{self.tour.id}/")
        self.assertEqual(other_view.status_code, status.HTTP_200_OK)
        other_puzzle = other_view.data["steps"][0]["puzzle"]
        self.assertNotIn("correct_answer", other_puzzle["open_ended"])
