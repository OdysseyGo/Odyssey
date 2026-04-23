import logging
from django_q.tasks import schedule, async_task
from django.utils import timezone
from .models import Notification, DeviceToken
from .services.apns import APNsService
from apps.users.models import User

logger = logging.getLogger(__name__)

def send_push_notification(user_id: int, title: str, body: str, 
                          extra_data: dict = None):
    """
    Send push notification to user's device
    Intended to be called via Django Q2
    """
    try:
        user = User.objects.get(id=user_id)
        
        # Get user's device tokens
        device_tokens = DeviceToken.objects.filter(user=user, is_active=True)
        
        if not device_tokens.exists():
            logger.warning(f"No active device tokens for user {user_id}")
            return False
        
        apns_service = APNsService()
        alert_dict = {'title': title, 'body': body}
        
        success_count = 0
        for token_obj in device_tokens:
            if apns_service.send_notification(
                token_obj.device_token,
                alert_dict,
                extra_data=extra_data
            ):
                success_count += 1
        
        # Log notification
        Notification.objects.create(
            user=user,
            title=title,
            body=body,
            data=extra_data,
            sent_count=success_count
        )
        
        return success_count > 0
        
    except Exception as e:
        logger.error(f"Error in send_push_notification: {str(e)}")
        return False


def schedule_notification(user_id: int, title: str, body: str, 
                         delay_minutes: int = 0, extra_data: dict = None):
    """
    Schedule a notification to be sent via Django Q2
    """
    if delay_minutes > 0:
        scheduled_time = timezone.now() + timezone.timedelta(minutes=delay_minutes)
        schedule(
            'apps.notifications.tasks.send_push_notification',
            user_id,
            title,
            body,
            extra_data,
            scheduled_time=scheduled_time
        )
    else:
        # Send immediately
        async_task(
            'apps.notifications.tasks.send_push_notification',
            user_id,
            title,
            body,
            extra_data
        )