from django.contrib import admin

from .models import DeviceToken, Notification, NotificationPreference


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "platform", "is_active", "created_at", "updated_at"]
    list_filter = ["platform", "is_active", "created_at"]
    search_fields = ["user__username", "device_token"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("User Info", {"fields": ("user",)}),
        ("Device Info", {"fields": ("device_token", "platform", "is_active")}),
        (
            "Timestamps",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["user", "title", "is_sent", "scheduled_at", "sent_at", "sent_count"]
    list_filter = ["is_sent", "created_at", "scheduled_at"]
    search_fields = ["user__username", "title", "body"]
    readonly_fields = ["created_at", "sent_at"]

    fieldsets = (
        ("Notification Content", {"fields": ("user", "title", "body", "data")}),
        (
            "Scheduling & Status",
            {
                "fields": ("is_sent", "scheduled_at", "sent_at"),
                "description": "When the notification will be sent, and was sent at.",
            },
        ),
        ("Delivery Info", {"fields": ("sent_count", "created_at")}),
    )

    actions = ["mark_as_pending"]

    @admin.action(description="Make choosen notifications to be sent again.")
    def mark_as_pending(self, request, queryset):
        queryset.update(is_sent=False, sent_at=None, sent_count=0)


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "new_tour",
        "tour_approved",
        "new_review",
        "new_follower",
        "friend_level_up",
    ]
    list_filter = [
        "new_tour",
        "tour_approved",
        "new_review",
        "new_follower",
        "friend_level_up",
    ]
    search_fields = ["user__username", "user__email"]

    fieldsets = (
        ("User Info", {"fields": ("user",)}),
        (
            "Preferences",
            {
                "fields": (
                    "new_tour",
                    "tour_approved",
                    "new_review",
                    "new_follower",
                    "friend_level_up",
                ),
                "description": "User push notification preferences (True = Enabled)",
            },
        ),
    )
