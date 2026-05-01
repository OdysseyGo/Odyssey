from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Review, Tour

User = get_user_model()


class ReviewPermissionTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="password123",
        )
        self.reviewer = User.objects.create_user(
            username="reviewer",
            email="reviewer@example.com",
            password="password123",
        )
        self.tour = Tour.objects.create(
            title="Reviewable Tour",
            description="desc",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=30,
            status=Tour.PUBLISHED,
        )

    def test_creator_cannot_create_review_for_own_tour(self):
        self.client.force_authenticate(user=self.creator)

        response = self.client.post(
            f"/api/tours/{self.tour.id}/reviews/",
            {"rating": 5, "comment": "Excellent"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Review.objects.filter(tour=self.tour).count(), 0)

    def test_non_creator_can_create_review(self):
        self.client.force_authenticate(user=self.reviewer)

        response = self.client.post(
            f"/api/tours/{self.tour.id}/reviews/",
            {"rating": 4, "comment": "Great tour"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Review.objects.filter(tour=self.tour, user=self.reviewer).count(), 1)

    def test_creator_cannot_update_review_on_own_tour(self):
        review = Review.objects.create(
            tour=self.tour,
            user=self.reviewer,
            rating=4,
            comment="Nice",
        )
        self.client.force_authenticate(user=self.creator)

        response = self.client.patch(
            f"/api/tours/{self.tour.id}/reviews/{review.id}/",
            {"comment": "Edited by creator"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        review.refresh_from_db()
        self.assertEqual(review.comment, "Nice")
