from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour

User = get_user_model()


class TourCreationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpassword123"
        )
        self.client.force_authenticate(user=self.user)

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
            "status": "PUBLISHED",
            "is_premium": False,
        }
        response = self.client.post("/api/tours/", tour_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        tour_id = response.data["id"]
        self.assertEqual(response.data["creator"]["id"], self.user.id)

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

        # 3. Verify Data
        tour = Tour.objects.get(pk=tour_id)
        self.assertEqual(tour.steps.count(), 2)
        step1 = tour.steps.get(order=0)
        self.assertEqual(step1.title, "Eiffel Tower")


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
    """End-to-end coverage for the mobile edit flow: PATCH tour + PATCH some
    steps + POST new steps + DELETE removed steps, all as the creator."""

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
        # PATCH tour metadata
        tour_patch = self.client.patch(
            f"/api/tours/{self.tour.id}/",
            {"title": "Updated Title", "duration_minutes": 90},
            format="json",
        )
        self.assertEqual(tour_patch.status_code, status.HTTP_200_OK)

        # PATCH an existing step (re-title + reorder)
        step_a_patch = self.client.patch(
            f"/api/tours/{self.tour.id}/steps/{self.step_a}/",
            {"title": "Step A (edited)", "order": 1},
            format="json",
        )
        self.assertEqual(step_a_patch.status_code, status.HTTP_200_OK)

        # Add a brand-new step
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

        # DELETE a removed step
        delete_c = self.client.delete(f"/api/tours/{self.tour.id}/steps/{self.step_c}/")
        self.assertEqual(delete_c.status_code, status.HTTP_204_NO_CONTENT)

        self.tour.refresh_from_db()
        self.assertEqual(self.tour.title, "Updated Title")
        self.assertEqual(self.tour.duration_minutes, 90)

        remaining_titles = set(self.tour.steps.values_list("title", flat=True))
        self.assertEqual(remaining_titles, {"Step A (edited)", "Step B", "Step D"})

    def test_step_order_zero_is_preserved(self):
        """Regression: order=0 is a valid value and must round-trip."""
        response = self.client.get(f"/api/tours/{self.tour.id}/steps/{self.step_a}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["order"], 0)
