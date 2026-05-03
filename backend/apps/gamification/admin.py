from django.contrib import admin

from .models import (
    Badge,
    PictureCompareConfig,
    StepLocationConfirmation,
    TourProgress,
    UserBadge,
    UserBadgeHistory,
)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "description", "created_at")
    search_fields = ("code", "name")


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "badge",
        "city",
        "country_code",
        "mistake_count",
        "earned_at",
    )
    list_filter = ("badge",)


@admin.register(UserBadgeHistory)
class UserBadgeHistoryAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "badge",
        "event_type",
        "source_tour",
        "city",
        "country_code",
        "mistake_count",
        "earned_at",
    )
    list_filter = ("badge", "event_type")
    search_fields = ("user__username", "badge__name", "source_tour__title")


@admin.register(TourProgress)
class TourProgressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "tour",
        "current_step",
        "status",
        "started_at",
        "completed_at",
    )
    list_filter = ("status",)


@admin.register(PictureCompareConfig)
class PictureCompareConfigAdmin(admin.ModelAdmin):
    list_display = ("singleton_id", "similarity_threshold", "updated_at")


@admin.register(StepLocationConfirmation)
class StepLocationConfirmationAdmin(admin.ModelAdmin):
    list_display = ("progress", "step", "distance_m", "confirmed_at")
    search_fields = ("progress__id", "step__id", "progress__user__username")
