from django.contrib import admin

from .models import AdImpression, AdPlacement, RewardedAdGrant


@admin.register(AdPlacement)
class AdPlacementAdmin(admin.ModelAdmin):
    list_display = (
        "key",
        "ad_format",
        "reward_type",
        "reward_amount",
        "enabled",
        "frequency_cap_per_day",
    )
    list_filter = ("ad_format", "reward_type", "enabled")
    search_fields = ("key", "description")


@admin.register(AdImpression)
class AdImpressionAdmin(admin.ModelAdmin):
    list_display = ("placement", "user", "platform", "shown_at")
    list_filter = ("platform", "placement")
    search_fields = ("user__username", "client_request_id")
    readonly_fields = ("client_request_id", "shown_at")


@admin.register(RewardedAdGrant)
class RewardedAdGrantAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "placement",
        "reward_type",
        "reward_amount",
        "granted_at",
        "consumed_at",
    )
    list_filter = ("reward_type", "placement")
    search_fields = ("user__username", "admob_transaction_id")
    readonly_fields = ("admob_transaction_id", "granted_at")
