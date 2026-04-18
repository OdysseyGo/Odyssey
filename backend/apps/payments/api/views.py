from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import CreditPack, Subscription, TourPurchase, Transaction
from apps.payments.services.credit_service import CreditService
from apps.payments.services.stripe_service import StripeService
from apps.tours.models import Tour
from apps.users.models.User import User  # noqa: F811

from .permissions import IsCreatorUser
from .serializers import (
    AIGenerationAllowanceSerializer,
    CreatorEarningsSerializer,
    CreditBalanceSerializer,
    CreditPackSerializer,
    CreditPurchaseRequestSerializer,
    PlanInfoSerializer,
    SubscribeRequestSerializer,
    SubscriptionSerializer,
    TourAccessSerializer,
    TransactionSerializer,
)


class PlansView(APIView):
    permission_classes = []

    @extend_schema(
        responses={200: PlanInfoSerializer(many=True)},
        description="List available subscription plans.",
    )
    def get(self, request):
        plans = [
            {
                "plan": "MONTHLY",
                "name": "Premium Monthly",
                "price_display": "$9.99/month",
                "interval": "month",
                "features": [
                    "Unlimited AI tour generation",
                    "Access all premium tours",
                    "Exclusive badges",
                    "Ad-free experience",
                ],
            },
            {
                "plan": "YEARLY",
                "name": "Premium Yearly",
                "price_display": "$79.99/year",
                "interval": "year",
                "features": [
                    "Unlimited AI tour generation",
                    "Access all premium tours",
                    "Exclusive badges",
                    "Ad-free experience",
                    "Save 33% vs monthly",
                ],
            },
        ]
        return Response(plans)


class SubscribeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=SubscribeRequestSerializer,
        responses={
            200: {"type": "object", "properties": {"checkout_url": {"type": "string"}}}
        },
        description="Create a Stripe Checkout Session for subscription.",
    )
    def post(self, request):
        serializer = SubscribeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            checkout_url = StripeService.create_subscription_checkout(
                user=request.user,
                plan=serializer.validated_data["plan"],
                success_url=request.data.get("success_url"),
                cancel_url=request.data.get("cancel_url"),
            )
            return Response({"checkout_url": checkout_url})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: SubscriptionSerializer},
        description="Get current user's subscription status.",
    )
    def get(self, request):
        try:
            sub = request.user.subscription
            serializer = SubscriptionSerializer(sub)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response(
                {"status": "NONE", "message": "No active subscription"},
                status=status.HTTP_200_OK,
            )


class CancelSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: SubscriptionSerializer},
        description="Cancel subscription at period end.",
    )
    def post(self, request):
        try:
            sub = StripeService.cancel_subscription(request.user)
            serializer = SubscriptionSerializer(sub)
            return Response(serializer.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ReactivateSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: SubscriptionSerializer},
        description="Reactivate a canceled subscription before period end.",
    )
    def post(self, request):
        try:
            sub = StripeService.reactivate_subscription(request.user)
            serializer = SubscriptionSerializer(sub)
            return Response(serializer.data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreditPackListView(APIView):
    permission_classes = []

    @extend_schema(
        responses={200: CreditPackSerializer(many=True)},
        description="List available credit packs.",
    )
    def get(self, request):
        packs = CreditPack.objects.filter(is_active=True)
        serializer = CreditPackSerializer(packs, many=True)
        return Response(serializer.data)


class CreditPurchaseView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=CreditPurchaseRequestSerializer,
        responses={
            200: {"type": "object", "properties": {"checkout_url": {"type": "string"}}}
        },
        description="Create a Stripe Checkout Session for credit purchase.",
    )
    def post(self, request):
        serializer = CreditPurchaseRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            checkout_url = StripeService.create_credit_purchase_checkout(
                user=request.user,
                pack_id=serializer.validated_data["pack_id"],
                success_url=request.data.get("success_url"),
                cancel_url=request.data.get("cancel_url"),
            )
            return Response({"checkout_url": checkout_url})
        except CreditPack.DoesNotExist:
            return Response(
                {"error": "Credit pack not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CreditBalanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: CreditBalanceSerializer},
        description="Get current credit balance and recent transactions.",
    )
    def get(self, request):
        recent = Transaction.objects.filter(user=request.user)[:20]
        data = {
            "balance": request.user.credit,
            "recent_transactions": TransactionSerializer(recent, many=True).data,
        }
        return Response(data)


class TourUnlockView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={
            200: {"type": "object", "properties": {"message": {"type": "string"}}}
        },
        description="Spend credits to unlock a premium tour.",
    )
    def post(self, request, tour_id):
        try:
            tour = Tour.objects.get(id=tour_id, status=Tour.PUBLISHED)
        except Tour.DoesNotExist:
            return Response(
                {"error": "Tour not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            CreditService.unlock_tour(user=request.user, tour=tour)
            return Response({"message": f"Tour '{tour.title}' unlocked successfully."})
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class TourAccessView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: TourAccessSerializer},
        description="Check if user has access to a specific tour.",
    )
    def get(self, request, tour_id):
        try:
            tour = Tour.objects.get(id=tour_id)
        except Tour.DoesNotExist:
            return Response(
                {"error": "Tour not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        has_access = CreditService.has_tour_access(request.user, tour)
        user_is_subscriber = request.user.user_type in (User.PREMIUM, User.CREATOR)
        already_purchased = TourPurchase.objects.filter(
            user=request.user, tour=tour
        ).exists()

        data = {
            "has_access": has_access,
            "is_premium": tour.is_premium,
            "credit_price": tour.credit_price,
            "user_is_subscriber": user_is_subscriber,
            "already_purchased": already_purchased,
        }
        return Response(data)


class AIGenerationAllowanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: AIGenerationAllowanceSerializer},
        description="Get AI generation quota for current user.",
    )
    def get(self, request):
        allowance = CreditService.get_ai_generation_allowance(request.user)
        return Response(allowance)


class CreatorEarningsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCreatorUser]

    @extend_schema(
        responses={200: CreatorEarningsSerializer},
        description="Get creator earnings summary.",
    )
    def get(self, request):
        earnings_qs = Transaction.objects.filter(
            user=request.user,
            transaction_type=Transaction.CREATOR_EARNING,
        )

        total_earnings = earnings_qs.aggregate(total=Sum("amount"))["total"] or 0
        total_tour_sales = TourPurchase.objects.filter(
            tour__creator=request.user
        ).count()

        recent_earnings = earnings_qs[:20]

        data = {
            "total_earnings": total_earnings,
            "total_tour_sales": total_tour_sales,
            "recent_earnings": TransactionSerializer(recent_earnings, many=True).data,
        }
        return Response(data)
