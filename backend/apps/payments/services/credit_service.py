from datetime import date

from django.conf import settings
from django.db import transaction as db_transaction

from apps.payments.models import TourPurchase, Transaction

FREE_AI_GENERATIONS_PER_MONTH = getattr(settings, "FREE_AI_GENERATIONS_PER_MONTH", 3)
CREATOR_REVENUE_SHARE_PERCENT = getattr(settings, "CREATOR_REVENUE_SHARE_PERCENT", 70)


class CreditService:
    @staticmethod
    def add_credits(
        user,
        amount,
        transaction_type,
        description,
        tour=None,
        apple_transaction_id="",
        related_user=None,
    ):
        with db_transaction.atomic():
            user.credit += amount
            user.save(update_fields=["credit"])

            return Transaction.objects.create(
                user=user,
                transaction_type=transaction_type,
                amount=amount,
                balance_after=user.credit,
                description=description,
                tour=tour,
                apple_transaction_id=apple_transaction_id,
                related_user=related_user,
            )

    @staticmethod
    def deduct_credits(
        user,
        amount,
        transaction_type,
        description,
        tour=None,
        related_user=None,
    ):
        if amount <= 0:
            raise ValueError("Deduction amount must be positive.")
        if user.credit < amount:
            raise ValueError(
                f"Insufficient credits. Balance: {user.credit}, required: {amount}."
            )

        with db_transaction.atomic():
            user.credit -= amount
            user.save(update_fields=["credit"])

            return Transaction.objects.create(
                user=user,
                transaction_type=transaction_type,
                amount=-amount,
                balance_after=user.credit,
                description=description,
                tour=tour,
                related_user=related_user,
            )

    @staticmethod
    def unlock_tour(user, tour):
        if tour.credit_price <= 0:
            raise ValueError("This tour is free and does not require unlocking.")

        if CreditService.has_tour_access(user, tour):
            raise ValueError("You already have access to this tour.")

        with db_transaction.atomic():
            CreditService.deduct_credits(
                user=user,
                amount=tour.credit_price,
                transaction_type=Transaction.TOUR_UNLOCK,
                description=f"Unlocked tour: {tour.title}",
                tour=tour,
                related_user=tour.creator,
            )

            purchase = TourPurchase.objects.create(
                user=user,
                tour=tour,
                credits_spent=tour.credit_price,
            )

            # Revenue share to creator (70% of credit_price)
            creator = tour.creator
            if creator.id != user.id:
                creator_share = int(
                    tour.credit_price * CREATOR_REVENUE_SHARE_PERCENT / 100
                )
                if creator_share > 0:
                    CreditService.add_credits(
                        user=creator,
                        amount=creator_share,
                        transaction_type=Transaction.CREATOR_EARNING,
                        description=f"Earning from tour: {tour.title}",
                        tour=tour,
                        related_user=user,
                    )

            return purchase

    @staticmethod
    def has_tour_access(user, tour):
        if not tour.is_premium and tour.credit_price == 0:
            return True

        from apps.users.models.User import User

        if user.user_type in (User.PREMIUM, User.CREATOR):
            return True

        if tour.creator_id == user.id:
            return True

        return TourPurchase.objects.filter(user=user, tour=tour).exists()

    @staticmethod
    def get_ai_generation_allowance(user):
        from apps.users.models.User import User

        unlimited = user.user_type in (User.PREMIUM, User.CREATOR)

        if unlimited:
            return {"used": 0, "limit": 0, "unlimited": True}

        today = date.today()
        if (
            user.ai_generation_reset_date is None
            or user.ai_generation_reset_date.month != today.month
            or user.ai_generation_reset_date.year != today.year
        ):
            user.ai_generations_this_month = 0
            user.ai_generation_reset_date = today
            user.save(
                update_fields=["ai_generations_this_month", "ai_generation_reset_date"]
            )

        return {
            "used": user.ai_generations_this_month,
            "limit": FREE_AI_GENERATIONS_PER_MONTH,
            "unlimited": False,
        }

    @staticmethod
    def record_ai_generation(user):
        today = date.today()
        if (
            user.ai_generation_reset_date is None
            or user.ai_generation_reset_date.month != today.month
            or user.ai_generation_reset_date.year != today.year
        ):
            user.ai_generations_this_month = 1
            user.ai_generation_reset_date = today
        else:
            user.ai_generations_this_month += 1

        user.save(
            update_fields=["ai_generations_this_month", "ai_generation_reset_date"]
        )
