from rest_framework import serializers
from .models import DeviceToken, Notification


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = ['id', 'device_token', 'platform', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'body', 'data', 'sent_count', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']
