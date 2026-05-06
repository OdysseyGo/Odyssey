from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.tours.models import Tour

User = get_user_model()


class UserPermissionsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="owner",
            email="owner@example.com",
            password="password123",
        )

    def test_users_list_requires_authentication(self):
        response = self.client.get("/api/users/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_retrieve_requires_authentication(self):
        response = self.client.get(f"/api/users/{self.user.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_update_requires_authentication(self):
        response = self.client.patch(
            f"/api/users/{self.user.id}/",
            {"email": "attacker@example.com"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_delete_requires_authentication(self):
        response = self.client.delete(f"/api/users/{self.user.id}/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_avatar_action_requires_authentication(self):
        response = self.client.patch(
            "/api/users/me/avatar/",
            {"avatar_url": "https://example.com/avatar.png"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_public_login_action_is_still_accessible_without_auth(self):
        response = self.client.post(
            "/api/users/login/",
            {"username": "missing", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_password_reset_actions_are_still_accessible_without_auth(self):
        request_reset = self.client.post(
            "/api/users/request-password-reset/",
            {"email": "missing@example.com"},
            format="json",
        )
        self.assertEqual(request_reset.status_code, status.HTTP_200_OK)

        reset_password = self.client.post(
            "/api/users/reset-password/",
            {},
            format="json",
        )
        self.assertEqual(reset_password.status_code, status.HTTP_400_BAD_REQUEST)

    def test_public_published_tours_action_is_still_accessible_without_auth(self):
        Tour.objects.create(
            title="Public tour",
            description="visible",
            creator=self.user,
            tour_type=Tour.STORY,
            category="history",
            duration_minutes=10,
            status=Tour.PUBLISHED,
        )

        response = self.client.get(f"/api/users/{self.user.id}/published-tours/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_public_get_by_username_action_is_accessible_without_auth(self):
        response = self.client.get(
            "/api/users/get-by-username/",
            {"username": self.user.username},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.user.id)
        self.assertEqual(response.data["username"], self.user.username)
        self.assertNotIn("email", response.data)


class UserCrudAuthorizationTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="owner2",
            email="owner2@example.com",
            password="password123",
        )
        self.other = User.objects.create_user(
            username="other2",
            email="other2@example.com",
            password="password123",
        )
        self.admin = User.objects.create_superuser(
            username="admin2",
            email="admin2@example.com",
            password="password123",
        )

    def test_authenticated_user_list_can_include_other_users(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get("results", response.data)
        result_ids = {item["id"] for item in results}
        self.assertIn(self.owner.id, result_ids)
        self.assertIn(self.other.id, result_ids)

    def test_authenticated_user_can_retrieve_other_user(self):
        self.client.force_authenticate(self.owner)

        response = self.client.get(f"/api/users/{self.other.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.other.id)

    def test_authenticated_user_cannot_update_other_user(self):
        self.client.force_authenticate(self.owner)

        response = self.client.patch(
            f"/api/users/{self.other.id}/",
            {"country": "TR"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_authenticated_user_cannot_delete_other_user(self):
        self.client.force_authenticate(self.owner)

        response = self.client.delete(f"/api/users/{self.other.id}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_superuser_can_retrieve_update_and_delete_other_user(self):
        self.client.force_authenticate(self.admin)

        retrieve = self.client.get(f"/api/users/{self.owner.id}/")
        self.assertEqual(retrieve.status_code, status.HTTP_200_OK)

        update = self.client.patch(
            f"/api/users/{self.owner.id}/",
            {"country": "TR"},
            format="json",
        )
        self.assertEqual(update.status_code, status.HTTP_200_OK)

        delete = self.client.delete(f"/api/users/{self.other.id}/")
        self.assertEqual(delete.status_code, status.HTTP_204_NO_CONTENT)
