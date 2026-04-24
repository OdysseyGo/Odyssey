from rest_framework import serializers

from apps.gamification.models import Badge, TourProgress, UserBadge
from apps.tours.models import Tour


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "name", "description", "icon", "criteria", "created_at"]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = UserBadge
        fields = ["id", "user", "badge", "earned_at"]
        read_only_fields = ["user", "earned_at"]


class TourProgressSerializer(serializers.ModelSerializer):
    tour_id = serializers.PrimaryKeyRelatedField(
        queryset=Tour.objects.all(), source="tour"
    )
    # Snapshot is the authoritative gameplay payload. `current_step_id` points
    # into tour_snapshot["steps"], not the live TourStep table.
    tour_snapshot = serializers.JSONField(read_only=True)
    current_step_id = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = TourProgress
        fields = [
            "id",
            "user",
            "tour_id",
            "tour_snapshot",
            "current_step_id",
            "status",
            "started_at",
            "completed_at",
            "total_xp",
            "skip_count",
        ]
        read_only_fields = [
            "user",
            "started_at",
            "completed_at",
            "tour_snapshot",
            "tour_id",
        ]
