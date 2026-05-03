# apps/notifications/signals.py

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import NotificationPreference


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_notification_preferences(sender, instance, created, **kwargs):
    """
    When a new User is created,
    a new notification preferance row is created.
    """
    if created:
        NotificationPreference.objects.get_or_create(user=instance)
