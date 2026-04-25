import uuid

from django.conf import settings
from django.db import models


class AdPlacement(models.Model):
    BANNER = "BANNER"
    INTERSTITIAL = "INTERSTITIAL"
    REWARDED = "REWARDED"
    FORMAT_CHOICES = [
        (BANNER, "Banner"),
        (INTERSTITIAL, "Interstitial"),
        (REWARDED, "Rewarded"),
    ]

    NONE = "NONE"
    CREDITS = "CREDITS"
    AI_SLOT = "AI_SLOT"
    HINT = "HINT"
    REWARD_TYPE_CHOICES = [
        (NONE, "None"),
        (CREDITS, "Credits"),
        (AI_SLOT, "AI Generation Slot"),
        (HINT, "Puzzle Hint or Skip"),
    ]

    key = models.SlugField(max_length=64, unique=True)
    description = models.CharField(max_length=255, blank=True)
    ad_format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    ad_unit_id_ios = models.CharField(max_length=128, blank=True)
    ad_unit_id_android = models.CharField(max_length=128, blank=True)
    enabled = models.BooleanField(default=True)
    frequency_cap_per_day = models.PositiveIntegerField(default=0)
    min_seconds_between = models.PositiveIntegerField(default=0)
    reward_type = models.CharField(
        max_length=20, choices=REWARD_TYPE_CHOICES, default=NONE
    )
    reward_amount = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "ad_placement"

    def __str__(self):
        return f"{self.key} ({self.ad_format})"


class AdImpression(models.Model):
    IOS = "ios"
    ANDROID = "android"
    PLATFORM_CHOICES = [(IOS, "iOS"), (ANDROID, "Android")]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ad_impressions",
    )
    placement = models.ForeignKey(
        AdPlacement, on_delete=models.CASCADE, related_name="impressions"
    )
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    client_request_id = models.UUIDField(default=uuid.uuid4, unique=True)
    shown_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ad_impression"
        indexes = [
            models.Index(fields=["user", "placement", "shown_at"]),
        ]
        ordering = ["-shown_at"]

    def __str__(self):
        return f"{self.placement.key} @ {self.shown_at:%Y-%m-%d %H:%M}"


class RewardedAdGrant(models.Model):
    CREDITS = "CREDITS"
    AI_SLOT = "AI_SLOT"
    HINT = "HINT"
    REWARD_TYPE_CHOICES = [
        (CREDITS, "Credits"),
        (AI_SLOT, "AI Generation Slot"),
        (HINT, "Puzzle Hint or Skip"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rewarded_grants",
    )
    placement = models.ForeignKey(
        AdPlacement, on_delete=models.PROTECT, related_name="grants"
    )
    admob_transaction_id = models.CharField(max_length=128, unique=True, db_index=True)
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPE_CHOICES)
    reward_amount = models.PositiveIntegerField()
    granted_at = models.DateTimeField(auto_now_add=True)
    consumed_at = models.DateTimeField(null=True, blank=True)
    consumed_context = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "rewarded_ad_grant"
        ordering = ["-granted_at"]

    def __str__(self):
        return f"{self.user_id} {self.reward_type} +{self.reward_amount}"

    @property
    def is_consumed(self):
        return self.consumed_at is not None
