from django.contrib import admin

from .models import (
    Badge,
    BadgeVisualOverride,
    BadgeVisualTemplate,
    PictureCompareConfig,
    TourProgress,
    UserBadge,
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


@admin.register(BadgeVisualTemplate)
class BadgeVisualTemplateAdmin(admin.ModelAdmin):
    list_display = ("singleton_id", "updated_at")


@admin.register(BadgeVisualOverride)
class BadgeVisualOverrideAdmin(admin.ModelAdmin):
    list_display = ("badge", "country_code", "updated_at")
    search_fields = ("badge__code", "badge__name", "country_code")
