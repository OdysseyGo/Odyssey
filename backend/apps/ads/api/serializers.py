from rest_framework import serializers

from apps.ads.models import AdPlacement, RewardedAdGrant


class AdPlacementSerializer(serializers.ModelSerializer):
    ad_unit_id = serializers.SerializerMethodField()

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
        )

    def get_ad_unit_id(self, obj):
        platform = self.context.get("platform", "ios")
        if platform == "android":
            return obj.ad_unit_id_android
        return obj.ad_unit_id_ios


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
