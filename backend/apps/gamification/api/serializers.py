from rest_framework import serializers

from django.db.models import Count

from apps.gamification.models import Badge, TourProgress, UserBadge, UserBadgeHistory
from apps.gamification.visuals import BadgeVisualService
from apps.tours.models import PuzzleAttempt, Tour


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "code", "name", "description", "icon", "criteria", "created_at"]


class UserBadgeSerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    visual_config = serializers.SerializerMethodField()
    source_tour_detail = serializers.SerializerMethodField()

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
            "source_tour_detail",
            "earned_at",
            "visual_config",
        ]
        read_only_fields = ["user", "earned_at"]

    def get_visual_config(self, obj):
        return BadgeVisualService.resolve_config(
            badge=obj.badge,
            country_code=obj.country_code,
        )

    def get_source_tour_detail(self, obj):
        tour = obj.source_tour
        if tour is None:
            return None
        return {
            "id": tour.id,
            "title": tour.title,
            "city": tour.city,
            "country": tour.country,
            "country_code": tour.country_code,
        }


class UserBadgeHistorySerializer(serializers.ModelSerializer):
    badge = BadgeSerializer(read_only=True)
    visual_config = serializers.SerializerMethodField()
    source_tour_detail = serializers.SerializerMethodField()

    class Meta:
        model = UserBadgeHistory
        fields = [
            "id",
            "user",
            "badge",
            "user_badge",
            "source_tour",
            "source_tour_detail",
            "city",
            "country_code",
            "mistake_count",
            "event_type",
            "earned_at",
            "visual_config",
        ]

    def get_visual_config(self, obj):
        return BadgeVisualService.resolve_config(
            badge=obj.badge,
            country_code=obj.country_code,
        )

    def get_source_tour_detail(self, obj):
        tour = obj.source_tour
        if tour is None:
            return None
        return {
            "id": tour.id,
            "title": tour.title,
            "city": tour.city,
            "country": tour.country,
            "country_code": tour.country_code,
        }


class TourProgressSerializer(serializers.ModelSerializer):
    tour_id = serializers.PrimaryKeyRelatedField(
        queryset=Tour.objects.all(), source="tour"
    )
    current_step = serializers.SerializerMethodField()
    # Snapshot is the authoritative gameplay payload. `current_step_id` points
    # into tour_snapshot["steps"], not the live TourStep table.
    tour_snapshot = serializers.JSONField(read_only=True)
    current_step_id = serializers.IntegerField(required=False, allow_null=True)
    step_attempt_counts = serializers.SerializerMethodField()

    class Meta:
        model = TourProgress
        fields = [
            "id",
            "user",
            "tour_id",
            "tour_snapshot",
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
        read_only_fields = [
            "user",
            "started_at",
            "completed_at",
            "tour_snapshot",
            "tour_id",
            "xp_awarded",
        ]

    def get_step_attempt_counts(self, obj):
        rows = (
            PuzzleAttempt.objects.filter(progress=obj, accepted=False)
            .values("puzzle__step__id")
            .annotate(count=Count("id"))
        )
        return {str(row["puzzle__step__id"]): row["count"] for row in rows}

    def get_current_step(self, obj):
        current_step = obj.current_step
        if current_step is None:
            return None
        return {
            "id": current_step.id,
            "order": current_step.order,
            "title": current_step.title,
        }
