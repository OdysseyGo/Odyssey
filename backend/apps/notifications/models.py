from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.users.models import User


class DeviceToken(models.Model):
    """Store device tokens for push notifications"""

    PLATFORM_CHOICES = [
        ("ios", "iOS"),
        ("android", "Android"),
    ]

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="device_tokens"
    )
    device_token = models.CharField(max_length=500)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES, default="ios")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user.username} - {self.platform}"


class Notification(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notifications"
    )
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    sent_count = models.IntegerField(default=0)

    is_sent = models.BooleanField(default=False)
    scheduled_at = models.DateTimeField(default=timezone.now)
    sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]


class NotificationPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notification_prefs",
    )
    new_tour = models.BooleanField(default=True)
    tour_approved = models.BooleanField(default=True)
    new_review = models.BooleanField(default=True)
    new_follower = models.BooleanField(default=True)
    friend_level_up = models.BooleanField(default=True)

    def __str__(self):
        return f"Notification Prefs for {self.user.username}"
