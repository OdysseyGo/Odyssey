from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.settings import api_settings
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthSecurityApiTests(APITestCase):
    def setUp(self):
        cache.clear()

    def test_signup_ignores_privileged_fields_and_keeps_defaults(self):
        payload = {
            "username": "attacker",
            "email": "attacker@example.com",
            "password": "StrongPass123!",
            "terms_accepted": True,
            "user_type": 3,
            "credit": 999999,
            "level": 99,
            "xp": 999999,
            "is_review_account": True,
        }

        response = self.client.post("/api/users/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="attacker")
        self.assertEqual(user.level, 1)
        self.assertEqual(user.credit, 0)
        self.assertEqual(user.xp, 0)
        self.assertEqual(user.user_type, User.NORMAL)
        self.assertFalse(user.is_review_account)

    def test_normal_signup_uses_server_defaults(self):
        payload = {
            "username": "regular_user",
            "email": "regular@example.com",
            "password": "StrongPass123!",
            "terms_accepted": True,
        }

        response = self.client.post("/api/users/", payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="regular_user")
        self.assertEqual(user.level, 1)
        self.assertEqual(user.credit, 0)
        self.assertEqual(user.xp, 0)
        self.assertEqual(user.user_type, User.NORMAL)
        self.assertFalse(user.is_review_account)

    def test_login_is_throttled_after_rate_limit(self):
        rest_framework_settings = dict(settings.REST_FRAMEWORK)
        throttle_rates = dict(rest_framework_settings.get("DEFAULT_THROTTLE_RATES", {}))
        throttle_rates["login_attempt"] = "3/minute"
        rest_framework_settings["DEFAULT_THROTTLE_RATES"] = throttle_rates

        with override_settings(
            REST_FRAMEWORK=rest_framework_settings,
            CACHES={
                "default": {
                    "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
                    "LOCATION": "auth-security-throttle-tests",
                }
            },
        ):
            api_settings.reload()
            cache.clear()
            self.client.defaults["REMOTE_ADDR"] = "10.0.0.1"

            for _ in range(3):
                response = self.client.post(
                    "/api/users/login/",
                    {"username": "missing", "password": "wrong"},
                    format="json",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

            response = self.client.post(
                "/api/users/login/",
                {"username": "missing", "password": "wrong"},
                format="json",
            )

            self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        api_settings.reload()

    def test_banned_user_cannot_login(self):
        user = User.objects.create_user(
            username="banned_login",
            email="banned_login@example.com",
            password="password123",
            is_banned=True,
        )

        response = self.client.post(
            "/api/users/login/",
            {"username": user.username, "password": "password123"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "This account is banned.")

    def test_banned_user_cannot_refresh_token(self):
        user = User.objects.create_user(
            username="banned_refresh",
            email="banned_refresh@example.com",
            password="password123",
        )
        refresh = RefreshToken.for_user(user)

        user.is_banned = True
        user.save(update_fields=["is_banned"])

        response = self.client.post(
            "/api/users/refresh-token/",
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "This account is banned.")

    def test_non_banned_user_can_refresh_token(self):
        user = User.objects.create_user(
            username="active_refresh",
            email="active_refresh@example.com",
            password="password123",
        )
        refresh = RefreshToken.for_user(user)

        response = self.client.post(
            "/api/users/refresh-token/",
            {"refresh": str(refresh)},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_user_update_rejects_privileged_fields(self):
        user = User.objects.create_user(
            username="cannot_escalate",
            email="cannot_escalate@example.com",
            password="password123",
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            f"/api/users/{user.id}/",
            {"level": 99, "credit": 12345, "user_type": User.CREATOR},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.level, 1)
        self.assertEqual(user.credit, 0)
        self.assertEqual(user.user_type, User.NORMAL)
