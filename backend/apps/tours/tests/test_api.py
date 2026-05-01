from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APITestCase

from apps.gamification.models import TourProgress
from apps.tours.models import Tour, TourStep
from apps.tours.utils import normalize_tour_country

User = get_user_model()


class TourCreationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)

    @staticmethod
    def _image_file(name="cover.gif"):
        image_content = (
            b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x05\x04\x04"
            b"\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44"
            b"\x01\x00\x3b"
        )
        return SimpleUploadedFile(name, image_content, content_type="image/gif")

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
            "cover_image": self._image_file(),
        }
        response = self.client.post("/api/tours/", tour_data, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tour_id = response.data["id"]
        self.assertEqual(response.data["creator"]["id"], self.user.id)
        self.assertEqual(response.data["generation_source"], Tour.USER)

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
        self.assertEqual(tour.generation_source, Tour.USER)
        self.assertEqual(tour.steps.count(), 2)
        step1 = tour.steps.get(order=0)
        self.assertEqual(step1.title, "Eiffel Tower")

    def test_create_tour_requires_cover_image(self):
        response = self.client.post(
            "/api/tours/",
            {
                "title": "Missing Cover",
                "description": "No image",
                "tour_type": "STORY",
                "category": "History",
                "difficulty": "EASY",
                "duration_minutes": 60,
                "status": "DRAFT",
                "is_premium": False,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cover_image", response.data)

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


class TourCompletionVisibilityApiTests(APITestCase):
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
        self.tour = Tour.objects.create(
            title="AI Tour",
            description="AI generated tour",
            creator=self.creator,
            tour_type=Tour.PUZZLE,
            category="Mystery",
            difficulty=Tour.EASY,
            duration_minutes=20,
            is_ai_generated=True,
            generation_source=Tour.AI,
        )
        self.first_step = TourStep.objects.create(
            tour=self.tour,
            order=0,
            title="First",
            description="",
            latitude="1.0",
            longitude="1.0",
        )

    def test_user_has_completed_once_is_scoped_to_authenticated_user(self):
        TourProgress.objects.create(
            user=self.creator,
            tour=self.tour,
            current_step_id=None,
            status=TourProgress.IN_PROGRESS,
            has_completed_once=True,
        )

        self.client.force_authenticate(user=self.creator)
        response = self.client.get(f"/api/tours/{self.tour.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["is_ai_generated"])
        self.assertTrue(response.data["user_has_completed_once"])

        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(f"/api/tours/{self.tour.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["user_has_completed_once"])

        self.client.force_authenticate(user=None)
        response = self.client.get(f"/api/tours/{self.tour.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["user_has_completed_once"])

    def test_my_tours_can_filter_ai_generated_tours(self):
        Tour.objects.create(
            title="Manual Tour",
            description="User created tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=30,
            generation_source=Tour.USER,
        )
        Tour.objects.create(
            title="Other User AI Tour",
            description="Should not leak into this user's showcase",
            creator=self.other_user,
            tour_type=Tour.PUZZLE,
            category="Mystery",
            difficulty=Tour.EASY,
            duration_minutes=25,
            is_ai_generated=True,
            generation_source=Tour.AI,
        )

        self.client.force_authenticate(user=self.creator)
        response = self.client.get(
            "/api/tours/my-tours/", {"generation_source": Tour.AI}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], self.tour.id)
        self.assertEqual(response.data["results"][0]["generation_source"], Tour.AI)


class TourOwnershipApiTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="creator", email="creator@example.com", password="testpassword123"
        )
        self.other_user = User.objects.create_user(
            username="other", email="other@example.com", password="testpassword123"
        )

    def test_my_tours_only_returns_current_user_tours(self):
        my_tour = Tour.objects.create(
            creator=self.creator,
            title="My Tour",
            description="Mine",
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Paris",
            status=Tour.PUBLISHED,
        )
        Tour.objects.create(
            creator=self.other_user,
            title="Other Tour",
            description="Not mine",
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=45,
            city="Rome",
            status=Tour.PUBLISHED,
        )

        self.client.force_authenticate(user=self.creator)
        response = self.client.get("/api/tours/my-tours/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["id"], my_tour.id)

    def test_creator_can_patch_own_tour(self):
        tour = Tour.objects.create(
            creator=self.creator,
            title="Original Title",
            description="Desc",
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Paris",
            status=Tour.PUBLISHED,
        )

        self.client.force_authenticate(user=self.creator)
        response = self.client.patch(
            f"/api/tours/{tour.id}/", {"title": "Updated Title"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tour.refresh_from_db()
        self.assertEqual(tour.title, "Updated Title")
        self.assertEqual(tour.status, Tour.DRAFT)

    def test_non_creator_cannot_patch_tour(self):
        tour = Tour.objects.create(
            creator=self.creator,
            title="Original Title",
            description="Desc",
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Paris",
            status=Tour.PUBLISHED,
        )

        self.client.force_authenticate(user=self.other_user)
        response = self.client.patch(
            f"/api/tours/{tour.id}/", {"title": "Illegal Update"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_creator_cannot_modify_other_users_steps(self):
        tour = Tour.objects.create(
            creator=self.creator,
            title="Step Tour",
            description="Desc",
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Paris",
            status=Tour.PUBLISHED,
        )

        self.client.force_authenticate(user=self.creator)
        create_step_response = self.client.post(
            f"/api/tours/{tour.id}/steps/",
            {
                "title": "Step 1",
                "description": "Step description",
                "latitude": "41.40338",
                "longitude": "2.17403",
                "order": 1,
            },
            format="json",
        )
        self.assertEqual(create_step_response.status_code, status.HTTP_201_CREATED)
        step_id = create_step_response.data["id"]

        self.client.force_authenticate(user=self.other_user)

        create_response = self.client.post(
            f"/api/tours/{tour.id}/steps/",
            {
                "title": "Unauthorized Step",
                "description": "Should fail",
                "latitude": "41.0",
                "longitude": "2.0",
                "order": 2,
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

        patch_response = self.client.patch(
            f"/api/tours/{tour.id}/steps/{step_id}/",
            {"title": "Unauthorized Update"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, status.HTTP_403_FORBIDDEN)

        delete_response = self.client.delete(f"/api/tours/{tour.id}/steps/{step_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)


class TourEditFlowApiTests(APITestCase):
    def setUp(self):
        self.creator = User.objects.create_user(
            username="editor", email="editor@example.com", password="testpassword123"
        )
        self.tour = Tour.objects.create(
            creator=self.creator,
            title="Original",
            description="Original desc",
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.EASY,
            duration_minutes=60,
            city="Paris",
            status=Tour.PUBLISHED,
        )
        self.client.force_authenticate(user=self.creator)
        self.step_a = self._create_step("Step A", order=0)
        self.step_b = self._create_step("Step B", order=1)
        self.step_c = self._create_step("Step C", order=2)
        self.tour.status = Tour.PUBLISHED
        self.tour.save(update_fields=["status"])

    def _create_step(self, title, order):
        response = self.client.post(
            f"/api/tours/{self.tour.id}/steps/",
            {
                "title": title,
                "description": f"{title} description",
                "latitude": "48.8584",
                "longitude": "2.2945",
                "order": order,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data["id"]

    def test_full_edit_flow(self):
        tour_patch = self.client.patch(
            f"/api/tours/{self.tour.id}/",
            {"title": "Updated Title", "duration_minutes": 90},
            format="json",
        )
        self.assertEqual(tour_patch.status_code, status.HTTP_200_OK)

        step_a_patch = self.client.patch(
            f"/api/tours/{self.tour.id}/steps/{self.step_a}/",
            {"title": "Step A (edited)", "order": 1},
            format="json",
        )
        self.assertEqual(step_a_patch.status_code, status.HTTP_200_OK)

        new_step = self.client.post(
            f"/api/tours/{self.tour.id}/steps/",
            {
                "title": "Step D",
                "description": "New stop",
                "latitude": "48.8600",
                "longitude": "2.3000",
                "order": 3,
            },
            format="json",
        )
        self.assertEqual(new_step.status_code, status.HTTP_201_CREATED)

        delete_c = self.client.delete(f"/api/tours/{self.tour.id}/steps/{self.step_c}/")
        self.assertEqual(delete_c.status_code, status.HTTP_204_NO_CONTENT)

        self.tour.refresh_from_db()
        self.assertEqual(self.tour.title, "Updated Title")
        self.assertEqual(self.tour.duration_minutes, 90)
        self.assertEqual(self.tour.status, Tour.DRAFT)

        remaining_titles = set(self.tour.steps.values_list("title", flat=True))
        self.assertEqual(remaining_titles, {"Step A (edited)", "Step B", "Step D"})

    def test_step_edit_sends_published_tour_back_to_review(self):
        response = self.client.patch(
            f"/api/tours/{self.tour.id}/steps/{self.step_a}/",
            {"title": "Needs review"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tour.refresh_from_db()
        self.assertEqual(self.tour.status, Tour.DRAFT)

    def test_step_order_zero_is_preserved(self):
        response = self.client.get(f"/api/tours/{self.tour.id}/steps/{self.step_a}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order"], 0)
