import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.notifications.models import DeviceToken, Notification
from apps.notifications.services.apns import APNsService

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Send notifications based on its scheduled time/date"

    def handle(self, *args, **options):
        now = timezone.now()
        pending_notifications = Notification.objects.filter(
            is_sent=False, scheduled_at__lte=now
        )

        if not pending_notifications.exists():
            # self.stdout.write("No notifications to send.")
            return

        apns = APNsService()

        for notif in pending_notifications:
            tokens = DeviceToken.objects.filter(user=notif.user, is_active=True)

            success_count = 0
            for token_obj in tokens:
                success = apns.send_notification(
                    device_token=token_obj.device_token,
                    alert_dict={"title": notif.title, "body": notif.body},
                    extra_data=notif.data,
                )
                if success:
                    success_count += 1

            notif.is_sent = True
            notif.sent_count = success_count
            notif.sent_at = timezone.now()
            notif.save()

            self.stdout.write(
                f"Successfully sent: {notif.title} -> {notif.user.username}"
            )

        # CLEAN-UP NOTIFS
        cleanup_threshold = now - timedelta(days=7)

        # Delete both sent and unsent old notifications to keep the DB clean
        old_notifications = Notification.objects.filter(
            created_at__lt=cleanup_threshold
        )
        count, _ = old_notifications.delete()

        if count > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Cleaned up {count} old notifications (older than 7 days)."
                )
            )
