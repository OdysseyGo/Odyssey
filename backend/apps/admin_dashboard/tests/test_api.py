from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch

from apps.admin_dashboard.models import BanRecord, Report
from apps.gamification.models import PictureCompareConfig
from apps.tours.models import Review, Tour, TourStep

User = get_user_model()


def image_file(name="image.jpg", color=(30, 80, 120)):
    image = Image.new("RGB", (120, 120), color=color)
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")


class AdminUserViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
        )
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="userpass123",
            user_type=User.NORMAL,
            country="Turkey",
        )
        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="userpass123",
            user_type=User.PREMIUM,
        )
        self.client.force_authenticate(user=self.admin)

    def test_list_users(self):
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 3)  # admin + 2 users

    def test_list_users_requires_staff(self):
        self.client.force_authenticate(user=self.user1)
        response = self.client.get("/api/admin/users/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_users_filter_by_user_type(self):
        response = self.client.get(f"/api/admin/users/?user_type={User.PREMIUM}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["username"], "user2")

    def test_list_users_search(self):
        response = self.client.get("/api/admin/users/?search=user1")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_retrieve_user_detail(self):
        response = self.client.get(f"/api/admin/users/{self.user1.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("badges_earned_count", response.data)
        self.assertIn("tours_created_count", response.data)
        self.assertIn("tours_completed_count", response.data)
        self.assertIn("reviews_count", response.data)

    def test_update_user_role(self):
        response = self.client.patch(
            f"/api/admin/users/{self.user1.id}/",
            {"user_type": User.CREATOR},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.refresh_from_db()
        self.assertEqual(self.user1.user_type, User.CREATOR)

    def test_ban_user(self):
        response = self.client.post(
            f"/api/admin/users/{self.user1.id}/ban/",
            {"reason": "Spam"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.user1.refresh_from_db()
        self.assertTrue(self.user1.is_banned)
        self.assertEqual(BanRecord.objects.filter(user=self.user1).count(), 1)

    def test_unban_user(self):
        BanRecord.objects.create(user=self.user1, banned_by=self.admin, reason="Spam")
        self.user1.is_banned = True
        self.user1.save()

        response = self.client.post(f"/api/admin/users/{self.user1.id}/unban/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.refresh_from_db()
        self.assertFalse(self.user1.is_banned)

    def test_bulk_ban(self):
        response = self.client.post(
            "/api/admin/users/bulk-action/",
            {
                "user_ids": [self.user1.id, self.user2.id],
                "action": "ban",
                "reason": "Bulk ban test",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        self.assertTrue(self.user1.is_banned)
        self.assertTrue(self.user2.is_banned)

    def test_bulk_change_role(self):
        response = self.client.post(
            "/api/admin/users/bulk-action/",
            {
                "user_ids": [self.user1.id, self.user2.id],
                "action": "change_role",
                "role": User.CREATOR,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user1.refresh_from_db()
        self.user2.refresh_from_db()
        self.assertEqual(self.user1.user_type, User.CREATOR)
        self.assertEqual(self.user2.user_type, User.CREATOR)

    def test_bulk_action_missing_users(self):
        response = self.client.post(
            "/api/admin/users/bulk-action/",
            {"user_ids": [99999], "action": "ban"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminTourViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
        )
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="creatorpass123",
        )
        self.tour = Tour.objects.create(
            title="Test Tour",
            description="A test tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Istanbul",
            country="Turkey",
            country_code="TR",
            status=Tour.DRAFT,
        )
        self.step = TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Step 1",
            latitude="41.0082",
            longitude="28.9784",
        )
        self.client.force_authenticate(user=self.admin)

    def test_list_tours(self):
        response = self.client.get("/api/admin/tours/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertIn("avg_rating", response.data["results"][0])
        self.assertIn("step_count", response.data["results"][0])

    def test_list_tours_filter_by_status(self):
        response = self.client.get("/api/admin/tours/?status=DRAFT")
        self.assertEqual(response.data["count"], 1)

        response = self.client.get("/api/admin/tours/?status=PUBLISHED")
        self.assertEqual(response.data["count"], 0)

    def test_retrieve_tour_detail(self):
        response = self.client.get(f"/api/admin/tours/{self.tour.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("steps", response.data)
        self.assertIn("reviews", response.data)
        self.assertEqual(len(response.data["steps"]), 1)

    def test_approve_tour(self):
        with patch(
            "apps.admin_dashboard.api.views.GoogleMapsFacade.tour_has_step_in_city",
            return_value=True,
        ):
            response = self.client.post(f"/api/admin/tours/{self.tour.id}/approve/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.PUBLISHED)

    def test_reject_tour(self):
        self.tour.status = Tour.PUBLISHED
        self.tour.save()

        response = self.client.post(f"/api/admin/tours/{self.tour.id}/reject/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.DRAFT)

    def test_archive_tour(self):
        response = self.client.post(f"/api/admin/tours/{self.tour.id}/archive/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.ARCHIVED)

    def test_delete_tour(self):
        response = self.client.delete(f"/api/admin/tours/{self.tour.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tour.objects.filter(id=self.tour.id).exists())

    def test_tour_analytics(self):
        Review.objects.create(tour=self.tour, user=self.admin, rating=4, comment="Good")
        response = self.client.get(f"/api/admin/tours/{self.tour.id}/analytics/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("avg_rating", response.data)
        self.assertIn("completion_count", response.data)


class PictureCompareTuningViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="user",
            email="user@example.com",
            password="userpass123",
        )
        self.client.force_authenticate(user=self.admin)

    def test_staff_can_simulate_picture_compare_tuning(self):
        response = self.client.post(
            "/api/admin/picture-compare-tuning/",
            {
                "reference_image": image_file("reference.jpg"),
                "attempt_image": image_file("attempt.jpg"),
                "threshold": 0.7,
                "base_weight": 0.5,
                "edge_weight": 0.2,
                "histogram_weight": 0.15,
                "grid_weight": 0.15,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("similarity_score", response.data)
        self.assertIn("accepted", response.data)
        self.assertIn("breakdown", response.data)
        self.assertIn("base_similarity", response.data["breakdown"])

    def test_picture_compare_tuning_requires_staff(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/admin/picture-compare-tuning/",
            {
                "reference_image": image_file("reference.jpg"),
                "attempt_image": image_file("attempt.jpg"),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_can_read_and_update_live_picture_compare_config(self):
        response = self.client.get("/api/admin/picture-compare-config/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["similarity_threshold"], 0.7)

        response = self.client.post(
            "/api/admin/picture-compare-config/",
            {
                "similarity_threshold": 0.83,
                "base_weight": 0.55,
                "edge_weight": 0.2,
                "histogram_weight": 0.15,
                "grid_weight": 0.1,
                "fast_max_shift": 10,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["similarity_threshold"], 0.83)
        config = PictureCompareConfig.load()
        self.assertEqual(config.similarity_threshold, 0.83)
        self.assertEqual(config.fast_max_shift, 10)

    def test_picture_compare_config_requires_staff(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/admin/picture-compare-config/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AnalyticsViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)

    def test_summary(self):
        response = self.client.get("/api/admin/analytics/summary/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_users", response.data)
        self.assertIn("total_tours", response.data)
        self.assertIn("new_users_7d", response.data)
        self.assertIn("pending_reports", response.data)

    def test_user_growth(self):
        response = self.client.get(
            "/api/admin/analytics/user-growth/?period=daily&days=7"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)

    def test_tour_growth(self):
        response = self.client.get(
            "/api/admin/analytics/tour-growth/?period=daily&days=7"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_top_tours(self):
        response = self.client.get(
            "/api/admin/analytics/top-tours/?order_by=rating&limit=5"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_distributions(self):
        response = self.client.get("/api/admin/analytics/distributions/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user_types", response.data)
        self.assertIn("tour_types", response.data)
        self.assertIn("difficulties", response.data)

    def test_active_users(self):
        response = self.client.get("/api/admin/analytics/active-users/?days=7")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("active_users", response.data)

    def test_requires_staff(self):
        regular = User.objects.create_user(
            username="regular", email="r@example.com", password="pass123"
        )
        self.client.force_authenticate(user=regular)
        response = self.client.get("/api/admin/analytics/summary/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class ReportViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
        )
        self.user = User.objects.create_user(
            username="reporter",
            email="reporter@example.com",
            password="userpass123",
        )
        self.offender = User.objects.create_user(
            username="offender",
            email="offender@example.com",
            password="userpass123",
        )
        self.tour = Tour.objects.create(
            title="Bad Tour",
            description="Offensive content",
            creator=self.offender,
            tour_type=Tour.STORY,
            category="Test",
            difficulty=Tour.EASY,
            duration_minutes=30,
            status=Tour.PUBLISHED,
        )

    def test_submit_report_as_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/reports/",
            {
                "content_type": "TOUR",
                "content_id": self.tour.id,
                "reason": "Offensive content",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Report.objects.count(), 1)
        report = Report.objects.first()
        self.assertEqual(report.reporter, self.user)
        self.assertEqual(report.status, Report.PENDING)

    def test_submit_report_validates_content_exists(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/reports/",
            {
                "content_type": "TOUR",
                "content_id": 99999,
                "reason": "Does not exist",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_submit_report_unauthenticated(self):
        response = self.client.post(
            "/api/reports/",
            {
                "content_type": "TOUR",
                "content_id": self.tour.id,
                "reason": "Bad",
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_reports_as_admin(self):
        Report.objects.create(
            reporter=self.user,
            content_type=Report.TOUR,
            content_id=self.tour.id,
            reason="Spam",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.get("/api/admin/reports/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_list_reports_filter_by_status(self):
        Report.objects.create(
            reporter=self.user,
            content_type=Report.TOUR,
            content_id=self.tour.id,
            reason="Spam",
            status=Report.PENDING,
        )
        self.client.force_authenticate(user=self.admin)

        response = self.client.get("/api/admin/reports/?status=PENDING")
        self.assertEqual(response.data["count"], 1)

        response = self.client.get("/api/admin/reports/?status=RESOLVED")
        self.assertEqual(response.data["count"], 0)

    def test_take_action_dismiss(self):
        report = Report.objects.create(
            reporter=self.user,
            content_type=Report.TOUR,
            content_id=self.tour.id,
            reason="Not really bad",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/admin/reports/{report.id}/take-action/",
            {"action": "dismiss", "admin_notes": "False alarm"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, Report.DISMISSED)
        self.assertEqual(report.resolved_by, self.admin)

    def test_take_action_remove_content(self):
        report = Report.objects.create(
            reporter=self.user,
            content_type=Report.TOUR,
            content_id=self.tour.id,
            reason="Offensive",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/admin/reports/{report.id}/take-action/",
            {"action": "remove_content"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.ARCHIVED)

    def test_take_action_ban_user(self):
        report = Report.objects.create(
            reporter=self.user,
            content_type=Report.TOUR,
            content_id=self.tour.id,
            reason="Repeated violations",
        )
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f"/api/admin/reports/{report.id}/take-action/",
            {"action": "ban_user", "ban_reason": "Repeated violations"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.offender.refresh_from_db()
        self.assertTrue(self.offender.is_banned)
        self.assertEqual(BanRecord.objects.filter(user=self.offender).count(), 1)
