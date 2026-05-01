from django.utils import timezone
from .models import Notification

def create_notification(user, title, body, data=None, scheduled_at=None):
    """
    Creates a notification record in the database to be picked up 
    by the Azure Container Apps Job.
    """
    if scheduled_at is None:
        scheduled_at = timezone.now()

    notification = Notification.objects.create(
        user=user,
        title=title,
        body=body,
        data=data or {},
        scheduled_at=scheduled_at,
        is_sent=False  
    )
    return notification