from io import BytesIO
import os
import tempfile
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from apps.admin_dashboard.models import BanRecord, Report
from apps.gamification.models import Badge, PictureCompareConfig
from apps.gamification.visuals import BadgeVisualFileRepository
from apps.tours.models import ARModel, Review, Tour, TourStep

User = get_user_model()


def image_file(name="image.jpg", color=(30, 80, 120)):
    image = Image.new("RGB", (120, 120), color=color)
    buffer = BytesIO()
    image.save(buffer, format="JPEG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/jpeg")


def glb_file(name="model.glb"):
    return SimpleUploadedFile(
        name,
        b"glTF\x02\x00\x00\x00admin-dashboard-model",
        content_type="model/gltf-binary",
    )


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
            response = self.client.post(
                f"/api/admin/tours/{self.tour.id}/approve/",
                {"city_latitude": 41.0082, "city_longitude": 28.9784},
                format="json",
            )
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


class AdminARModelViewSetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin",
            email="admin@example.com",
            password="adminpass123",
            is_staff=True,
        )
        self.client.force_authenticate(user=self.admin)
        self.model = ARModel.objects.create(
            slug="bronze-statue",
            name="Bronze Statue",
            preview_image=image_file("bronze-preview.jpg"),
            scene_asset_file=glb_file("bronze.glb"),
            anchors=[
                {
                    "id": "anchor-1",
                    "label": "Anchor 1",
                    "position": {"x": 0.1, "y": 0.2, "z": 0.3},
                    "order": 0,
                }
            ],
            is_active=True,
            sort_order=10,
        )

    def test_list_ar_models(self):
        response = self.client.get("/api/admin/ar-models/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["anchor_count"], 1)
        self.assertTrue(response.data["results"][0]["scene_asset_url"].endswith(".glb"))

    def test_create_ar_model(self):
        response = self.client.post(
            "/api/admin/ar-models/",
            {
                "name": "Lion Statue",
                "slug": "lion-statue",
                "scene_asset_file": glb_file("lion.glb"),
                "preview_image": image_file("lion-preview.jpg"),
                "anchors": (
                    '[{"id":"anchor-1","label":"Anchor 1","position":'
                    '{"x":1,"y":2,"z":3},"order":0}]'
                ),
                "is_active": "true",
                "sort_order": "2",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = ARModel.objects.get(slug="lion-statue")
        self.assertTrue(bool(created.scene_asset_file))
        self.assertTrue(bool(created.preview_image))
        self.assertEqual(created.anchors[0]["id"], "anchor-1")
        self.assertTrue(response.data["preview_image_url"].endswith(".jpg"))

    def test_create_rejects_missing_preview(self):
        response = self.client.post(
            "/api/admin/ar-models/",
            {
                "name": "Invalid Model",
                "slug": "invalid-model",
                "scene_asset_file": glb_file("invalid.glb"),
                "anchors": '[{"id":"anchor-1","label":"A","position":{"x":0,"y":0,"z":0},"order":0}]',
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("preview_image", response.data)

    def test_create_rejects_duplicate_anchor_ids(self):
        response = self.client.post(
            "/api/admin/ar-models/",
            {
                "name": "Invalid Model",
                "slug": "invalid-model-duplicate-anchors",
                "scene_asset_file": glb_file("invalid.glb"),
                "preview_image": image_file("invalid-preview.jpg"),
                "anchors": (
                    '[{"id":"dup","label":"A","position":{"x":0,"y":0,"z":0},"order":0},'
                    '{"id":"dup","label":"B","position":{"x":1,"y":1,"z":1},"order":1}]'
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("anchors", response.data)

    def test_patch_metadata_only(self):
        response = self.client.patch(
            f"/api/admin/ar-models/{self.model.id}/",
            {"name": "Renamed Statue", "sort_order": 99},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.model.refresh_from_db()
        self.assertEqual(self.model.name, "Renamed Statue")
        self.assertEqual(self.model.sort_order, 99)

    def test_patch_anchors_only(self):
        response = self.client.patch(
            f"/api/admin/ar-models/{self.model.id}/",
            {
                "anchors": [
                    {
                        "id": "anchor-2",
                        "label": "Anchor 2",
                        "position": {"x": 9, "y": 8, "z": 7},
                        "order": 0,
                    }
                ]
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.model.refresh_from_db()
        self.assertEqual(self.model.anchors[0]["id"], "anchor-2")

    def test_patch_replacement_model_file(self):
        response = self.client.patch(
            f"/api/admin/ar-models/{self.model.id}/",
            {"scene_asset_file": glb_file("replacement.glb")},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.model.refresh_from_db()
        self.assertTrue(self.model.scene_asset_file.name.endswith(".glb"))


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


class BadgeVisualViewSetTests(APITestCase):
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
        self.badge = Badge.objects.create(
            code="CITY_GOLD",
            name="City Gold",
            description="Badge",
            criteria={"kind": "city_first_completion"},
        )
        self._badge_visuals_tmpdir = tempfile.TemporaryDirectory()
        self._original_badge_visual_path = os.environ.get("BADGE_VISUAL_CONFIG_PATH")
        os.environ["BADGE_VISUAL_CONFIG_PATH"] = os.path.join(
            self._badge_visuals_tmpdir.name,
            "badge_visuals.json",
        )
        BadgeVisualFileRepository.write(
            {"template": {}, "overrides": [], "meta": {"version": 1}}
        )
        self.client.force_authenticate(user=self.admin)

    def tearDown(self):
        if self._original_badge_visual_path is None:
            os.environ.pop("BADGE_VISUAL_CONFIG_PATH", None)
        else:
            os.environ["BADGE_VISUAL_CONFIG_PATH"] = self._original_badge_visual_path
        self._badge_visuals_tmpdir.cleanup()

    def test_list_bundle(self):
        response = self.client.get("/api/admin/badge-visuals/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("template", response.data)
        self.assertIn("overrides", response.data)
        self.assertIn("badges", response.data)

    def test_update_template(self):
        response = self.client.post(
            "/api/admin/badge-visuals/template/",
            {"config": {"flag": {"x": 0.2, "width": 0.7}}},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["config"]["flag"]["x"], 0.2)
        self.assertEqual(response.data["config"]["flag"]["width"], 0.7)

    def test_upsert_override(self):
        response = self.client.post(
            "/api/admin/badge-visuals/overrides/",
            {
                "badge": self.badge.id,
                "country_code": "FR",
                "config": {"text": {"x": 0.6, "rotation_deg": 60}},
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["country_code"], "FR")
        self.assertEqual(response.data["badge"], self.badge.id)
        payload = BadgeVisualFileRepository.read()
        self.assertEqual(len(payload["overrides"]), 1)
        self.assertEqual(payload["overrides"][0]["badge_code"], "CITY_GOLD")

    def test_delete_override(self):
        upsert_response = self.client.post(
            "/api/admin/badge-visuals/overrides/",
            {
                "badge": self.badge.id,
                "country_code": "TR",
                "config": {"flag": {"x": 0.12}},
            },
            format="json",
        )
        override_id = upsert_response.data["id"]
        response = self.client.delete(f"/api/admin/badge-visuals/overrides/{override_id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        payload = BadgeVisualFileRepository.read()
        self.assertEqual(payload["overrides"], [])

    def test_export_config(self):
        response = self.client.get("/api/admin/badge-visuals/export/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response["Content-Type"], "application/json")
        self.assertIn("attachment; filename=\"badge_visuals.json\"", response["Content-Disposition"])

    def test_requires_staff(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/admin/badge-visuals/")
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
