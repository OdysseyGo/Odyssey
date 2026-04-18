from rest_framework import serializers

from apps.payments.models import CreditPack, Subscription, TourPurchase, Transaction


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "status",
            "current_period_start",
            "current_period_end",
            "cancel_at_period_end",
            "created_at",
        ]
        read_only_fields = fields


class SubscribeRequestSerializer(serializers.Serializer):
    plan = serializers.ChoiceField(choices=Subscription.PLAN_CHOICES)


class CreditPackSerializer(serializers.ModelSerializer):
    price_display = serializers.SerializerMethodField()

    class Meta:
        model = CreditPack
        fields = [
            "id",
            "name",
            "credits",
            "price_cents",
            "currency",
            "price_display",
        ]
        read_only_fields = fields

    def get_price_display(self, obj):
        return f"${obj.price_cents / 100:.2f}"


class CreditPurchaseRequestSerializer(serializers.Serializer):
    pack_id = serializers.IntegerField()


class TransactionSerializer(serializers.ModelSerializer):
    tour_title = serializers.CharField(source="tour.title", default=None)

    class Meta:
        model = Transaction
        fields = [
            "id",
            "transaction_type",
            "amount",
            "balance_after",
            "description",
            "tour_title",
            "created_at",
        ]
        read_only_fields = fields


class TourPurchaseSerializer(serializers.ModelSerializer):
    tour_title = serializers.CharField(source="tour.title", read_only=True)

    class Meta:
        model = TourPurchase
        fields = ["id", "tour", "tour_title", "credits_spent", "purchased_at"]
        read_only_fields = fields


class TourAccessSerializer(serializers.Serializer):
    has_access = serializers.BooleanField()
    is_premium = serializers.BooleanField()
    credit_price = serializers.IntegerField()
    user_is_subscriber = serializers.BooleanField()
    already_purchased = serializers.BooleanField()


class PlanInfoSerializer(serializers.Serializer):
    plan = serializers.CharField()
    name = serializers.CharField()
    price_display = serializers.CharField()
    interval = serializers.CharField()
    features = serializers.ListField(child=serializers.CharField())


class CreditBalanceSerializer(serializers.Serializer):
    balance = serializers.IntegerField()
    recent_transactions = TransactionSerializer(many=True)


class CreatorEarningsSerializer(serializers.Serializer):
    total_earnings = serializers.IntegerField()
    total_tour_sales = serializers.IntegerField()
    recent_earnings = TransactionSerializer(many=True)


class AIGenerationAllowanceSerializer(serializers.Serializer):
    used = serializers.IntegerField()
    limit = serializers.IntegerField()
    unlimited = serializers.BooleanField()
