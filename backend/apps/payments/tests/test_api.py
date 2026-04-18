from datetime import date

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from apps.payments.models import CreditPack, Transaction
from apps.payments.services.credit_service import CreditService
from apps.tours.models import Tour

User = get_user_model()


class CreditServiceTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            user_type=User.NORMAL,
            credit=100,
        )
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="testpass123",
            user_type=User.CREATOR,
            credit=0,
        )
        self.tour = Tour.objects.create(
            title="Premium Tour",
            description="A premium tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.MEDIUM,
            duration_minutes=60,
            is_premium=True,
            credit_price=50,
            status=Tour.PUBLISHED,
        )

    def test_add_credits(self):
        tx = CreditService.add_credits(
            user=self.user,
            amount=50,
            transaction_type=Transaction.PURCHASE,
            description="Test purchase",
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.credit, 150)
        self.assertEqual(tx.amount, 50)
        self.assertEqual(tx.balance_after, 150)

    def test_deduct_credits(self):
        tx = CreditService.deduct_credits(
            user=self.user,
            amount=30,
            transaction_type=Transaction.TOUR_UNLOCK,
            description="Test deduction",
        )
        self.user.refresh_from_db()
        self.assertEqual(self.user.credit, 70)
        self.assertEqual(tx.amount, -30)
        self.assertEqual(tx.balance_after, 70)

    def test_deduct_credits_insufficient(self):
        with self.assertRaises(ValueError) as ctx:
            CreditService.deduct_credits(
                user=self.user,
                amount=200,
                transaction_type=Transaction.TOUR_UNLOCK,
                description="Too much",
            )
        self.assertIn("Insufficient credits", str(ctx.exception))
        self.user.refresh_from_db()
        self.assertEqual(self.user.credit, 100)

    def test_unlock_tour(self):
        purchase = CreditService.unlock_tour(self.user, self.tour)
        self.user.refresh_from_db()
        self.creator.refresh_from_db()

        self.assertEqual(self.user.credit, 50)  # 100 - 50
        self.assertEqual(purchase.credits_spent, 50)

        # Creator should get 70% = 35 credits
        self.assertEqual(self.creator.credit, 35)

        # Verify transactions
        user_txs = Transaction.objects.filter(user=self.user)
        self.assertEqual(user_txs.count(), 1)
        self.assertEqual(user_txs.first().amount, -50)

        creator_txs = Transaction.objects.filter(user=self.creator)
        self.assertEqual(creator_txs.count(), 1)
        self.assertEqual(creator_txs.first().amount, 35)

    def test_unlock_tour_already_owned(self):
        CreditService.unlock_tour(self.user, self.tour)
        with self.assertRaises(ValueError):
            CreditService.unlock_tour(self.user, self.tour)

    def test_unlock_free_tour_raises(self):
        free_tour = Tour.objects.create(
            title="Free Tour",
            description="A free tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="Free",
            difficulty=Tour.EASY,
            duration_minutes=30,
            is_premium=False,
            status=Tour.PUBLISHED,
        )
        with self.assertRaises(ValueError):
            CreditService.unlock_tour(self.user, free_tour)

    def test_has_tour_access_free_tour(self):
        free_tour = Tour.objects.create(
            title="Free Tour",
            description="A free tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="Free",
            difficulty=Tour.EASY,
            duration_minutes=30,
            is_premium=False,
            status=Tour.PUBLISHED,
        )
        self.assertTrue(CreditService.has_tour_access(self.user, free_tour))

    def test_has_tour_access_premium_subscriber(self):
        premium_user = User.objects.create_user(
            username="premium",
            email="premium@example.com",
            password="testpass123",
            user_type=User.PREMIUM,
        )
        self.assertTrue(CreditService.has_tour_access(premium_user, self.tour))

    def test_has_tour_access_purchased(self):
        CreditService.unlock_tour(self.user, self.tour)
        self.assertTrue(CreditService.has_tour_access(self.user, self.tour))

    def test_has_tour_access_not_purchased(self):
        self.assertFalse(CreditService.has_tour_access(self.user, self.tour))

    def test_has_tour_access_creator_own_tour(self):
        self.assertTrue(CreditService.has_tour_access(self.creator, self.tour))

    def test_ai_generation_allowance_free_user(self):
        allowance = CreditService.get_ai_generation_allowance(self.user)
        self.assertFalse(allowance["unlimited"])
        self.assertEqual(allowance["used"], 0)
        self.assertEqual(allowance["limit"], 3)

    def test_ai_generation_allowance_premium_user(self):
        premium_user = User.objects.create_user(
            username="premium2",
            email="prem2@example.com",
            password="testpass123",
            user_type=User.PREMIUM,
        )
        allowance = CreditService.get_ai_generation_allowance(premium_user)
        self.assertTrue(allowance["unlimited"])

    def test_record_ai_generation(self):
        CreditService.record_ai_generation(self.user)
        self.user.refresh_from_db()
        self.assertEqual(self.user.ai_generations_this_month, 1)
        self.assertEqual(self.user.ai_generation_reset_date, date.today())

        CreditService.record_ai_generation(self.user)
        self.user.refresh_from_db()
        self.assertEqual(self.user.ai_generations_this_month, 2)


class PaymentEndpointTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpass123",
            user_type=User.NORMAL,
            credit=200,
        )
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="testpass123",
            user_type=User.CREATOR,
        )
        self.premium_tour = Tour.objects.create(
            title="Premium Tour",
            description="A premium tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="History",
            difficulty=Tour.MEDIUM,
            duration_minutes=60,
            is_premium=True,
            credit_price=50,
            status=Tour.PUBLISHED,
        )
        self.free_tour = Tour.objects.create(
            title="Free Tour",
            description="A free tour",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="Nature",
            difficulty=Tour.EASY,
            duration_minutes=30,
            is_premium=False,
            status=Tour.PUBLISHED,
        )
        self.credit_pack = CreditPack.objects.create(
            name="Starter Pack",
            credits=100,
            price_cents=499,
            currency="usd",
            stripe_price_id="price_test_starter",
            is_active=True,
        )
        self.client.force_authenticate(user=self.user)

    def test_list_plans(self):
        response = self.client.get("/api/payments/plans/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        plans = {p["plan"] for p in response.data}
        self.assertEqual(plans, {"MONTHLY", "YEARLY"})

    def test_list_credit_packs(self):
        response = self.client.get("/api/payments/credit-packs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["name"], "Starter Pack")

    def test_credit_balance(self):
        response = self.client.get("/api/payments/credits/balance/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["balance"], 200)

    def test_tour_unlock(self):
        response = self.client.post(
            f"/api/payments/tours/{self.premium_tour.id}/unlock/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("unlocked", response.data["message"])

        self.user.refresh_from_db()
        self.assertEqual(self.user.credit, 150)

    def test_tour_unlock_insufficient_credits(self):
        self.user.credit = 10
        self.user.save()

        response = self.client.post(
            f"/api/payments/tours/{self.premium_tour.id}/unlock/"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tour_unlock_duplicate(self):
        self.client.post(f"/api/payments/tours/{self.premium_tour.id}/unlock/")
        response = self.client.post(
            f"/api/payments/tours/{self.premium_tour.id}/unlock/"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tour_access_free_tour(self):
        response = self.client.get(f"/api/payments/tours/{self.free_tour.id}/access/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_access"])

    def test_tour_access_premium_no_access(self):
        response = self.client.get(
            f"/api/payments/tours/{self.premium_tour.id}/access/"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["has_access"])
        self.assertEqual(response.data["credit_price"], 50)

    def test_tour_access_after_unlock(self):
        self.client.post(f"/api/payments/tours/{self.premium_tour.id}/unlock/")
        response = self.client.get(
            f"/api/payments/tours/{self.premium_tour.id}/access/"
        )
        self.assertTrue(response.data["has_access"])
        self.assertTrue(response.data["already_purchased"])

    def test_subscription_no_subscription(self):
        response = self.client.get("/api/payments/subscription/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "NONE")

    def test_ai_allowance(self):
        response = self.client.get("/api/payments/ai-allowance/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["unlimited"])
        self.assertEqual(response.data["limit"], 3)

    def test_creator_earnings_requires_creator(self):
        response = self.client.get("/api/payments/creator/earnings/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_creator_earnings(self):
        self.client.force_authenticate(user=self.creator)
        response = self.client.get("/api/payments/creator/earnings/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("total_earnings", response.data)
        self.assertIn("total_tour_sales", response.data)

    def test_unauthenticated_cannot_unlock(self):
        self.client.force_authenticate(user=None)
        response = self.client.post(
            f"/api/payments/tours/{self.premium_tour.id}/unlock/"
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TourAccessGatingTests(APITestCase):
    """Test that premium tour steps are hidden for non-authorized users."""

    def setUp(self):
        self.creator = User.objects.create_user(
            username="creator",
            email="creator@example.com",
            password="testpass123",
            user_type=User.CREATOR,
        )
        self.free_user = User.objects.create_user(
            username="freeuser",
            email="free@example.com",
            password="testpass123",
            user_type=User.NORMAL,
            credit=0,
        )
        self.premium_user = User.objects.create_user(
            username="premuser",
            email="prem@example.com",
            password="testpass123",
            user_type=User.PREMIUM,
        )
        self.tour = Tour.objects.create(
            title="Premium Tour",
            description="Premium content",
            creator=self.creator,
            tour_type=Tour.STORY,
            category="Art",
            difficulty=Tour.MEDIUM,
            duration_minutes=45,
            is_premium=True,
            credit_price=30,
            status=Tour.PUBLISHED,
        )
        from apps.tours.models import TourStep

        TourStep.objects.create(
            tour=self.tour,
            order=1,
            title="Step 1",
            description="First step",
            latitude="41.0",
            longitude="29.0",
        )

    def test_free_user_sees_no_steps_on_premium_tour(self):
        self.client.force_authenticate(user=self.free_user)
        response = self.client.get(f"/api/tours/{self.tour.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["steps"], [])
        self.assertFalse(response.data["has_access"])
        self.assertEqual(response.data["step_count"], 1)

    def test_premium_user_sees_steps(self):
        self.client.force_authenticate(user=self.premium_user)
        response = self.client.get(f"/api/tours/{self.tour.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["has_access"])
        self.assertEqual(len(response.data["steps"]), 1)

    def test_creator_only_can_set_premium(self):
        self.client.force_authenticate(user=self.free_user)
        response = self.client.post(
            "/api/tours/",
            {
                "title": "My Tour",
                "description": "A tour",
                "tour_type": "STORY",
                "category": "Test",
                "difficulty": "EASY",
                "duration_minutes": 30,
                "is_premium": True,
                "credit_price": 50,
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Even though user tried to set premium, it should be overridden
        self.assertFalse(response.data["is_premium"])
        self.assertEqual(response.data["credit_price"], 0)


class AdminCreditAdjustmentTests(APITestCase):
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
            credit=100,
        )
        self.client.force_authenticate(user=self.admin)

    def test_admin_add_credits(self):
        response = self.client.post(
            f"/api/admin/users/{self.user.id}/adjust-credits/",
            {"amount": 50, "reason": "Refund for issue"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.credit, 150)

    def test_admin_deduct_credits(self):
        response = self.client.post(
            f"/api/admin/users/{self.user.id}/adjust-credits/",
            {"amount": -30, "reason": "Correction"},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.credit, 70)

    def test_admin_adjust_requires_staff(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            f"/api/admin/users/{self.user.id}/adjust-credits/",
            {"amount": 50},
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
