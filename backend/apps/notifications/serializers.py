from rest_framework import serializers

from .models import DeviceToken, Notification


class DeviceTokenSerializer(serializers.ModelSerializer):
    """
    Serializer for DeviceToken model to handle push notification tokens
    """

    class Meta:
        model = DeviceToken
        fields = [
            "id",
            "device_token",
            "platform",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class NotificationSerializer(serializers.ModelSerializer):
    """
    Serializer for Notification model including scheduling and delivery status
    """

    class Meta:
        model = Notification
        # Included new fields for the scheduled delivery system
        fields = [
            "id",
            "user",
            "title",
            "body",
            "data",
            "is_sent",
            "scheduled_at",
            "sent_at",
            "sent_count",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "is_sent",
            "sent_at",
            "sent_count",
            "created_at",
        ]
