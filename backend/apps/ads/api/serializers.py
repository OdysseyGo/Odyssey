from django.utils import timezone
from rest_framework import serializers

from apps.ads.models import AdPlacement, RewardedAdGrant


class AdPlacementSerializer(serializers.ModelSerializer):
    ad_unit_id = serializers.SerializerMethodField()
    remaining_today = serializers.SerializerMethodField()

    class Meta:
        model = AdPlacement
        fields = (
            "key",
            "ad_format",
            "reward_type",
            "reward_amount",
            "ad_unit_id",
            "frequency_cap_per_day",
            "min_seconds_between",
            "remaining_today",
        )

    def get_ad_unit_id(self, obj):
        platform = self.context.get("platform", "ios")
        if platform == "android":
            return obj.ad_unit_id_android
        return obj.ad_unit_id_ios

    def get_remaining_today(self, obj):
        user = self.context.get("user")
        if not user or not getattr(user, "is_authenticated", False):
            return 0
        if obj.frequency_cap_per_day <= 0:
            return 0

        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        shown_today = obj.impressions.filter(
            user=user, shown_at__gte=today_start
        ).count()
        return max(0, obj.frequency_cap_per_day - shown_today)


class AdImpressionCreateSerializer(serializers.Serializer):
    placement_key = serializers.SlugField()
    platform = serializers.ChoiceField(choices=["ios", "android"])
    client_request_id = serializers.UUIDField()


class RewardedAdGrantSerializer(serializers.ModelSerializer):
    is_consumed = serializers.BooleanField(read_only=True)

    class Meta:
        model = RewardedAdGrant
        fields = (
            "id",
            "reward_type",
            "reward_amount",
            "granted_at",
            "consumed_at",
            "is_consumed",
        )
        read_only_fields = fields


class ConsumeGrantSerializer(serializers.Serializer):
    context = serializers.DictField(required=False, default=dict)
