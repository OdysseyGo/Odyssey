import logging
from datetime import datetime, timezone

from appstoreserverlibrary.models.Environment import Environment
from appstoreserverlibrary.signed_data_verifier import (
    SignedDataVerifier,
    VerificationException,
)
from django.conf import settings
from django.db import transaction as db_transaction

from apps.payments.models import CreditPack, Subscription, Transaction
from apps.payments.services.credit_service import CreditService

logger = logging.getLogger(__name__)


SUBSCRIPTION_PRODUCT_MAP = {
    "com.odyssey.subscription.monthly": Subscription.MONTHLY,
    "com.odyssey.subscription.yearly": Subscription.YEARLY,
}


def _env_from_string(value):
    if value == "Sandbox":
        return Environment.SANDBOX
    return Environment.PRODUCTION


def _ms_to_datetime(ms):
    return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc)


def _build_verifier():
    private_key = settings.APPLE_PRIVATE_KEY.encode("utf-8")
    env = _env_from_string(settings.APPLE_ENVIRONMENT)
    return (
        SignedDataVerifier(
            root_certificates=[],
            enable_online_checks=False,
            environment=env,
            bundle_id=settings.APPLE_BUNDLE_ID,
            app_apple_id=getattr(settings, "APPLE_APP_APPLE_ID", None),
        ),
        private_key,
    )


class AppleIapService:
    @staticmethod
    def verify_transaction(jws_signed_transaction):
        verifier, _ = _build_verifier()
        try:
            payload = verifier.verify_and_decode_signed_transaction(
                jws_signed_transaction
            )
        except VerificationException as e:
            raise ValueError(f"Invalid Apple transaction signature: {e}")

        if payload.bundleId != settings.APPLE_BUNDLE_ID:
            raise ValueError("Bundle ID mismatch.")

        return payload

    @staticmethod
    def fulfill_transaction(user, payload):
        product_id = payload.productId
        if product_id in SUBSCRIPTION_PRODUCT_MAP:
            return AppleIapService.fulfill_subscription(user, payload)
        return AppleIapService.fulfill_consumable(user, payload)

    @staticmethod
    def fulfill_consumable(user, payload):
        transaction_id = str(payload.transactionId)
        existing = Transaction.objects.filter(
            apple_transaction_id=transaction_id
        ).first()
        if existing:
            return existing

        try:
            pack = CreditPack.objects.get(
                apple_product_id=payload.productId, is_active=True
            )
        except CreditPack.DoesNotExist:
            raise ValueError(f"Unknown credit pack: {payload.productId}")

        return CreditService.add_credits(
            user=user,
            amount=pack.credits,
            transaction_type=Transaction.PURCHASE,
            description=f"Purchased {pack.name} ({pack.credits} credits)",
            apple_transaction_id=transaction_id,
        )

    @staticmethod
    def fulfill_subscription(user, payload):
        from apps.users.models.User import User

        plan = SUBSCRIPTION_PRODUCT_MAP.get(payload.productId)
        if not plan:
            raise ValueError(f"Unknown subscription product: {payload.productId}")

        original_transaction_id = str(payload.originalTransactionId)
        purchase_date = _ms_to_datetime(payload.purchaseDate)
        expires_date = _ms_to_datetime(payload.expiresDate)
        environment = (
            Subscription.SANDBOX
            if payload.environment
            and str(payload.environment).lower().endswith("sandbox")
            else Subscription.PRODUCTION
        )

        with db_transaction.atomic():
            sub, _ = Subscription.objects.update_or_create(
                user=user,
                defaults={
                    "apple_original_transaction_id": original_transaction_id,
                    "apple_product_id": payload.productId,
                    "apple_environment": environment,
                    "plan": plan,
                    "status": Subscription.ACTIVE,
                    "current_period_start": purchase_date,
                    "current_period_end": expires_date,
                    "cancel_at_period_end": False,
                },
            )

            if user.user_type == User.NORMAL:
                user.user_type = User.PREMIUM
                user.save(update_fields=["user_type"])

        return sub

    @staticmethod
    def handle_server_notification(signed_payload):
        verifier, _ = _build_verifier()
        try:
            notification = verifier.verify_and_decode_notification(signed_payload)
        except VerificationException as e:
            raise ValueError(f"Invalid Apple notification signature: {e}")

        notification_type = str(notification.notificationType)
        data = notification.data
        if data is None or data.signedTransactionInfo is None:
            logger.info(
                "Apple notification without transaction info: %s", notification_type
            )
            return

        try:
            tx_payload = verifier.verify_and_decode_signed_transaction(
                data.signedTransactionInfo
            )
        except VerificationException as e:
            raise ValueError(f"Invalid embedded transaction: {e}")

        renewal_payload = None
        if data.signedRenewalInfo:
            try:
                renewal_payload = verifier.verify_and_decode_renewal_info(
                    data.signedRenewalInfo
                )
            except VerificationException:
                renewal_payload = None

        AppleIapService._apply_notification(
            notification_type, tx_payload, renewal_payload
        )

    @staticmethod
    def _apply_notification(notification_type, tx_payload, renewal_payload):
        from apps.users.models.User import User

        original_transaction_id = str(tx_payload.originalTransactionId)
        try:
            sub = Subscription.objects.select_related("user").get(
                apple_original_transaction_id=original_transaction_id
            )
        except Subscription.DoesNotExist:
            logger.info(
                "Notification for unknown subscription %s (%s)",
                original_transaction_id,
                notification_type,
            )
            return

        user = sub.user

        if notification_type in ("SUBSCRIBED", "DID_RENEW"):
            sub.status = Subscription.ACTIVE
            sub.current_period_start = _ms_to_datetime(tx_payload.purchaseDate)
            sub.current_period_end = _ms_to_datetime(tx_payload.expiresDate)
            sub.cancel_at_period_end = False
            sub.save(
                update_fields=[
                    "status",
                    "current_period_start",
                    "current_period_end",
                    "cancel_at_period_end",
                    "updated_at",
                ]
            )
            if user.user_type == User.NORMAL:
                user.user_type = User.PREMIUM
                user.save(update_fields=["user_type"])

        elif notification_type == "DID_FAIL_TO_RENEW":
            sub.status = Subscription.PAST_DUE
            sub.save(update_fields=["status", "updated_at"])

        elif notification_type == "EXPIRED":
            sub.status = Subscription.EXPIRED
            sub.save(update_fields=["status", "updated_at"])
            if user.user_type == User.PREMIUM:
                user.user_type = User.NORMAL
                user.save(update_fields=["user_type"])

        elif notification_type == "DID_CHANGE_RENEWAL_STATUS":
            auto_renew = True
            if (
                renewal_payload is not None
                and renewal_payload.autoRenewStatus is not None
            ):
                auto_renew = int(renewal_payload.autoRenewStatus) == 1
            sub.cancel_at_period_end = not auto_renew
            sub.status = (
                Subscription.CANCELED if not auto_renew else Subscription.ACTIVE
            )
            sub.save(update_fields=["cancel_at_period_end", "status", "updated_at"])

        elif notification_type == "REFUND":
            sub.status = Subscription.EXPIRED
            sub.save(update_fields=["status", "updated_at"])
            if user.user_type == User.PREMIUM:
                user.user_type = User.NORMAL
                user.save(update_fields=["user_type"])

        else:
            logger.info("Unhandled Apple notification type: %s", notification_type)
