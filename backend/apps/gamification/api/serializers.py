from rest_framework import serializers
from apps.gamification.models import Badge, UserBadge, TourProgress
from apps.tours.api.serializers import TourSerializer, TourStepSerializer

class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'criteria', 'created_at']

class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ['id', 'user', 'badge', 'earned_at']
        read_only_fields = ['user', 'earned_at']

from apps.tours.models import Tour, TourStep

class TourProgressSerializer(serializers.ModelSerializer):
    tour = TourSerializer(read_only=True)
    tour_id = serializers.PrimaryKeyRelatedField(
        queryset=Tour.objects.all(), source='tour', write_only=True
    )
    current_step = TourStepSerializer(read_only=True)
    current_step_id = serializers.PrimaryKeyRelatedField(
        queryset=TourStep.objects.all(), source='current_step', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = TourProgress
        fields = ['id', 'user', 'tour', 'tour_id', 'current_step', 'current_step_id', 'status', 'started_at', 'completed_at']
        read_only_fields = ['user', 'started_at', 'completed_at']
