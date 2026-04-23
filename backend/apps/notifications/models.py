from django.db import models
from django.utils import timezone
from apps.users.models import User


class DeviceToken(models.Model):
    """Store device tokens for push notifications"""
    
    PLATFORM_CHOICES = [
        ('ios', 'iOS'),
        ('android', 'Android'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='device_tokens')
    device_token = models.CharField(max_length=500, unique=True)
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES, default='ios')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.platform}"


class Notification(models.Model):
    """Log of sent notifications"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    body = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    sent_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"