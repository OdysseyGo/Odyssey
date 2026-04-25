"""Grant rewarded-ad rewards to users.

Idempotent on `admob_transaction_id`. CREDITS rewards are written through the
KAN-58 `apps.payments.services.credit_service.CreditService` so they show up in
the existing `Transaction` ledger; AI_SLOT and HINT rewards are stored as
unconsumed `RewardedAdGrant` rows that the AI / puzzle endpoints redeem later.
"""

import logging

from django.db import IntegrityError
from django.db import transaction as db_transaction

from apps.ads.models import AdPlacement, RewardedAdGrant

logger = logging.getLogger(__name__)

AD_REWARD_TRANSACTION_TYPE = "AD_REWARD"


class RewardServiceError(Exception):
    pass


def grant(
    user,
    placement: AdPlacement,
    admob_transaction_id: str,
    reward_amount: int = 0,
):
    """Grant a reward to `user` for a verified rewarded-ad impression.

    Returns (grant, created). If a RewardedAdGrant with this
    admob_transaction_id already exists, returns it with created=False
    without granting again (idempotent replay protection).
    """
    if placement.reward_type == AdPlacement.NONE:
        raise RewardServiceError(f"Placement {placement.key} has reward_type=NONE.")

    amount = placement.reward_amount or reward_amount
    if amount <= 0:
        raise RewardServiceError("Reward amount must be positive.")

    with db_transaction.atomic():
        try:
            with db_transaction.atomic():
                grant_row = RewardedAdGrant.objects.create(
                    user=user,
                    placement=placement,
                    admob_transaction_id=admob_transaction_id,
                    reward_type=placement.reward_type,
                    reward_amount=amount,
                )
        except IntegrityError:
            existing = RewardedAdGrant.objects.get(
                admob_transaction_id=admob_transaction_id
            )
            return existing, False

        if placement.reward_type == AdPlacement.CREDITS:
            _credit_user(user, amount, placement)
            grant_row.consumed_at = grant_row.granted_at
            grant_row.save(update_fields=["consumed_at"])

        return grant_row, True


def _credit_user(user, amount, placement):
    """Credit the user via KAN-58 CreditService. Lazy import — payments app
    is not present on branches without KAN-58."""
    from apps.payments.services.credit_service import CreditService

    CreditService.add_credits(
        user=user,
        amount=amount,
        transaction_type=AD_REWARD_TRANSACTION_TYPE,
        description=f"Rewarded ad: {placement.key}",
    )


def consume(grant_row: RewardedAdGrant, context: dict):
    """Mark an AI_SLOT or HINT grant as consumed. Returns True if newly
    consumed, False if it was already consumed."""
    if grant_row.reward_type == RewardedAdGrant.CREDITS:
        raise RewardServiceError("CREDITS grants are auto-consumed at grant time.")

    with db_transaction.atomic():
        locked = (
            RewardedAdGrant.objects.select_for_update()
            .filter(pk=grant_row.pk, consumed_at__isnull=True)
            .first()
        )
        if locked is None:
            return False
        from django.utils import timezone

        locked.consumed_at = timezone.now()
        locked.consumed_context = context or {}
        locked.save(update_fields=["consumed_at", "consumed_context"])
    return True
