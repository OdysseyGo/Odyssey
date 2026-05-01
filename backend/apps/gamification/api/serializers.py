from rest_framework import serializers

from apps.gamification.models import Badge, TourProgress, UserBadge
from apps.gamification.visuals import BadgeVisualService
from apps.tours.api.serializers import TourSerializer, TourStepSerializer


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "code", "name", "description", "icon", "criteria", "created_at"]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    visual_config = serializers.SerializerMethodField()

    class Meta:
        model = UserBadge
        fields = [
            "id",
            "user",
            "badge",
            "city",
            "country_code",
            "mistake_count",
            "source_tour",
            "earned_at",
            "visual_config",
        ]
        read_only_fields = ["user", "earned_at"]

    def get_visual_config(self, obj):
        return BadgeVisualService.resolve_config(
            badge=obj.badge,
            country_code=obj.country_code,
        )


from django.db.models import Count

from apps.tours.models import PuzzleAttempt, Tour, TourStep


class TourProgressSerializer(serializers.ModelSerializer):
    tour = TourSerializer(read_only=True)
    tour_id = serializers.PrimaryKeyRelatedField(
        queryset=Tour.objects.all(), source="tour", write_only=True
    )
    current_step = TourStepSerializer(read_only=True)
    current_step_id = serializers.PrimaryKeyRelatedField(
        queryset=TourStep.objects.all(),
        source="current_step",
        write_only=True,
        required=False,
        allow_null=True,
    )
    step_attempt_counts = serializers.SerializerMethodField()

    class Meta:
        model = TourProgress
        fields = [
            "id",
            "user",
            "tour",
            "tour_id",
            "current_step",
            "current_step_id",
            "status",
            "started_at",
            "completed_at",
            "total_xp",
            "skip_count",
            "xp_awarded",
            "wrong_attempt_count",
            "step_attempt_counts",
        ]
        read_only_fields = ["user", "started_at", "completed_at", "xp_awarded"]

    def get_step_attempt_counts(self, obj):
        rows = (
            PuzzleAttempt.objects.filter(progress=obj, accepted=False)
            .values("puzzle__step__id")
            .annotate(count=Count("id"))
        )
        return {str(row["puzzle__step__id"]): row["count"] for row in rows}
