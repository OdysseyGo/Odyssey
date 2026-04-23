from django.contrib import admin

from .models import Badge, PictureCompareConfig, TourProgress, UserBadge


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ("user", "badge", "earned_at")
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
