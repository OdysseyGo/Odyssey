import logging
from datetime import datetime, timezone

import stripe
from django.conf import settings

from apps.payments.models import CreditPack, Subscription, Transaction
from apps.payments.services.credit_service import CreditService

logger = logging.getLogger(__name__)

stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")


class StripeService:
    @staticmethod
    def _get_or_create_customer(user):
        if user.stripe_customer_id:
            return user.stripe_customer_id

        customer = stripe.Customer.create(
            email=user.email,
            name=f"{user.first_name} {user.last_name}".strip() or user.username,
            metadata={"user_id": str(user.id)},
        )
        user.stripe_customer_id = customer.id
        user.save(update_fields=["stripe_customer_id"])
        return customer.id

    @staticmethod
    def create_subscription_checkout(user, plan, success_url=None, cancel_url=None):
        customer_id = StripeService._get_or_create_customer(user)

        price_id_map = {
            Subscription.MONTHLY: settings.STRIPE_MONTHLY_PRICE_ID,
            Subscription.YEARLY: settings.STRIPE_YEARLY_PRICE_ID,
        }
        price_id = price_id_map.get(plan)
        if not price_id:
            raise ValueError(f"Invalid plan: {plan}")

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="subscription",
            success_url=success_url or settings.STRIPE_SUCCESS_URL,
            cancel_url=cancel_url or settings.STRIPE_CANCEL_URL,
            metadata={"user_id": str(user.id), "plan": plan},
        )
        return session.url

    @staticmethod
    def create_credit_purchase_checkout(
        user, pack_id, success_url=None, cancel_url=None
    ):
        pack = CreditPack.objects.get(id=pack_id, is_active=True)
        customer_id = StripeService._get_or_create_customer(user)

        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[{"price": pack.stripe_price_id, "quantity": 1}],
            mode="payment",
            success_url=success_url or settings.STRIPE_SUCCESS_URL,
            cancel_url=cancel_url or settings.STRIPE_CANCEL_URL,
            metadata={
                "user_id": str(user.id),
                "type": "credit_purchase",
                "pack_id": str(pack.id),
            },
        )
        return session.url

    @staticmethod
    def cancel_subscription(user):
        try:
            sub = user.subscription
        except Subscription.DoesNotExist:
            raise ValueError("No active subscription found.")

        if sub.status != Subscription.ACTIVE:
            raise ValueError("Subscription is not active.")
        if sub.cancel_at_period_end:
            raise ValueError("Subscription is already scheduled for cancellation.")

        stripe.Subscription.modify(
            sub.stripe_subscription_id,
            cancel_at_period_end=True,
        )
        sub.cancel_at_period_end = True
        sub.save(update_fields=["cancel_at_period_end", "updated_at"])
        return sub

    @staticmethod
    def reactivate_subscription(user):
        try:
            sub = user.subscription
        except Subscription.DoesNotExist:
            raise ValueError("No subscription found.")

        if not sub.cancel_at_period_end:
            raise ValueError("Subscription is not scheduled for cancellation.")

        stripe.Subscription.modify(
            sub.stripe_subscription_id,
            cancel_at_period_end=False,
        )
        sub.cancel_at_period_end = False
        sub.save(update_fields=["cancel_at_period_end", "updated_at"])
        return sub

    @staticmethod
    def handle_webhook(payload, sig_header):
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except (ValueError, stripe.error.SignatureVerificationError):
            raise ValueError("Invalid webhook signature.")

        event_type = event.type
        data = event.data.object

        handler = {
            "checkout.session.completed": StripeService._handle_checkout_completed,
            "invoice.paid": StripeService._handle_invoice_paid,
            "invoice.payment_failed": StripeService._handle_invoice_payment_failed,
            "customer.subscription.updated": StripeService._handle_subscription_updated,
            "customer.subscription.deleted": StripeService._handle_subscription_deleted,
        }.get(event_type)

        if handler:
            handler(data)
        else:
            logger.info("Unhandled Stripe event: %s", event_type)

    @staticmethod
    def _handle_checkout_completed(session):
        metadata = session.metadata.to_dict() if session.metadata else {}
        mode = session.mode

        if mode == "subscription":
            StripeService._fulfill_subscription(session, metadata)
        elif metadata.get("type") == "credit_purchase":
            StripeService._fulfill_credit_purchase(session, metadata)

    @staticmethod
    def _fulfill_subscription(session, metadata):
        from apps.users.models.User import User

        user_id = int(metadata["user_id"])
        plan = metadata["plan"]
        user = User.objects.get(id=user_id)

        stripe_sub_id = session.subscription
        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
        item = stripe_sub.items.data[0]

        Subscription.objects.update_or_create(
            user=user,
            defaults={
                "stripe_customer_id": session.customer,
                "stripe_subscription_id": stripe_sub_id,
                "plan": plan,
                "status": Subscription.ACTIVE,
                "current_period_start": datetime.fromtimestamp(
                    item.current_period_start, tz=timezone.utc
                ),
                "current_period_end": datetime.fromtimestamp(
                    item.current_period_end, tz=timezone.utc
                ),
            },
        )

        if user.user_type == User.NORMAL:
            user.user_type = User.PREMIUM
            user.save(update_fields=["user_type"])

    @staticmethod
    def _fulfill_credit_purchase(session, metadata):
        from apps.users.models.User import User

        user_id = int(metadata["user_id"])
        pack_id = int(metadata["pack_id"])
        user = User.objects.get(id=user_id)
        pack = CreditPack.objects.get(id=pack_id)

        payment_intent = session.payment_intent or ""

        CreditService.add_credits(
            user=user,
            amount=pack.credits,
            transaction_type=Transaction.PURCHASE,
            description=f"Purchased {pack.name} ({pack.credits} credits)",
            stripe_payment_intent_id=payment_intent,
        )

    @staticmethod
    def _handle_invoice_paid(invoice):
        parent = invoice.parent
        if not parent or not parent.subscription_details:
            return
        stripe_sub_id = parent.subscription_details.subscription
        if not stripe_sub_id:
            return

        try:
            sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        except Subscription.DoesNotExist:
            return

        stripe_sub = stripe.Subscription.retrieve(stripe_sub_id)
        item = stripe_sub.items.data[0]
        sub.status = Subscription.ACTIVE
        sub.current_period_start = datetime.fromtimestamp(
            item.current_period_start, tz=timezone.utc
        )
        sub.current_period_end = datetime.fromtimestamp(
            item.current_period_end, tz=timezone.utc
        )
        sub.save(
            update_fields=[
                "status",
                "current_period_start",
                "current_period_end",
                "updated_at",
            ]
        )

    @staticmethod
    def _handle_invoice_payment_failed(invoice):
        parent = invoice.parent
        if not parent or not parent.subscription_details:
            return
        stripe_sub_id = parent.subscription_details.subscription
        if not stripe_sub_id:
            return

        try:
            sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        except Subscription.DoesNotExist:
            return

        sub.status = Subscription.PAST_DUE
        sub.save(update_fields=["status", "updated_at"])

    @staticmethod
    def _handle_subscription_updated(stripe_sub):
        stripe_sub_id = stripe_sub.id
        try:
            sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        except Subscription.DoesNotExist:
            return

        item = stripe_sub.items.data[0]
        sub.current_period_start = datetime.fromtimestamp(
            item.current_period_start, tz=timezone.utc
        )
        sub.current_period_end = datetime.fromtimestamp(
            item.current_period_end, tz=timezone.utc
        )
        sub.cancel_at_period_end = stripe_sub.cancel_at_period_end

        status = stripe_sub.status
        status_map = {
            "active": Subscription.ACTIVE,
            "past_due": Subscription.PAST_DUE,
            "canceled": Subscription.CANCELED,
        }
        sub.status = status_map.get(status, sub.status)
        sub.save(
            update_fields=[
                "current_period_start",
                "current_period_end",
                "cancel_at_period_end",
                "status",
                "updated_at",
            ]
        )

    @staticmethod
    def _handle_subscription_deleted(stripe_sub):
        stripe_sub_id = stripe_sub.id
        try:
            sub = Subscription.objects.get(stripe_subscription_id=stripe_sub_id)
        except Subscription.DoesNotExist:
            return

        sub.status = Subscription.EXPIRED
        sub.save(update_fields=["status", "updated_at"])

        from apps.users.models.User import User

        user = sub.user
        if user.user_type == User.PREMIUM:
            user.user_type = User.NORMAL
            user.save(update_fields=["user_type"])
