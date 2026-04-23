from rest_framework import serializers

from apps.payments.models import CreditPack, Subscription, TourPurchase, Transaction


class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = [
            "id",
            "plan",
            "status",
            "apple_product_id",
            "current_period_start",
            "current_period_end",
            "cancel_at_period_end",
            "created_at",
        ]
        read_only_fields = fields


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
            "apple_product_id",
        ]
        read_only_fields = fields

    def get_price_display(self, obj):
        amount = obj.price_cents / 100
        currency_code = (obj.currency or "").upper()
        symbols = {"USD": "$", "EUR": "€", "GBP": "£"}
        symbol = symbols.get(currency_code)
        if symbol:
            return f"{symbol}{amount:.2f}"
        if currency_code:
            return f"{currency_code} {amount:.2f}"
        return f"{amount:.2f}"


class IapVerifyRequestSerializer(serializers.Serializer):
    jws_signed_transaction = serializers.CharField()


class IapVerifyResponseSerializer(serializers.Serializer):
    kind = serializers.ChoiceField(choices=["subscription", "consumable"])
    balance = serializers.IntegerField(required=False)
    subscription = SubscriptionSerializer(required=False)


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
    apple_product_id = serializers.CharField()


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


class ManageSubscriptionSerializer(serializers.Serializer):
    manage_url = serializers.CharField()
