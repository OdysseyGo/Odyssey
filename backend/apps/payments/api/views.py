import logging

from django.db.models import Sum
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.models import CreditPack, Subscription, TourPurchase, Transaction
from apps.payments.services.apple_iap_service import (
    SUBSCRIPTION_PRODUCT_MAP,
    AppleIapService,
)
from apps.payments.services.credit_service import CreditService
from apps.tours.models import Tour
from apps.users.models.User import User  # noqa: F811

from .permissions import IsCreatorUser
from .serializers import (
    AIGenerationAllowanceSerializer,
    CreatorEarningsSerializer,
    CreditBalanceSerializer,
    CreditPackSerializer,
    IapVerifyRequestSerializer,
    IapVerifyResponseSerializer,
    ManageSubscriptionSerializer,
    PlanInfoSerializer,
    SubscriptionSerializer,
    TourAccessSerializer,
    TransactionSerializer,
)

logger = logging.getLogger(__name__)


APPLE_MANAGE_SUBSCRIPTION_URL = "https://apps.apple.com/account/subscriptions"


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
                "apple_product_id": "com.odyssey.subscription.monthly",
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
                "apple_product_id": "com.odyssey.subscription.yearly",
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


class IapVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        request=IapVerifyRequestSerializer,
        responses={200: IapVerifyResponseSerializer},
        description="Verify an Apple IAP JWS transaction and fulfill the purchase.",
    )
    def post(self, request):
        serializer = IapVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            payload = AppleIapService.verify_transaction(
                serializer.validated_data["jws_signed_transaction"]
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = AppleIapService.fulfill_transaction(request.user, payload)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if payload.productId in SUBSCRIPTION_PRODUCT_MAP:
            return Response(
                {
                    "kind": "subscription",
                    "subscription": SubscriptionSerializer(result).data,
                }
            )

        request.user.refresh_from_db()
        return Response(
            {
                "kind": "consumable",
                "balance": request.user.credit,
            }
        )


class IapNotificationsView(APIView):
    permission_classes = []
    authentication_classes = []

    @extend_schema(
        request={"type": "object", "properties": {"signedPayload": {"type": "string"}}},
        responses={200: {"type": "object"}},
        description="App Store Server Notifications V2 endpoint.",
    )
    def post(self, request):
        signed_payload = request.data.get("signedPayload")
        if not signed_payload:
            return Response(
                {"error": "Missing signedPayload."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            AppleIapService.handle_server_notification(signed_payload)
        except ValueError as e:
            logger.warning("Apple notification verification failed: %s", e)
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error("Apple notification processing error: %s", e)
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(status=status.HTTP_200_OK)


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


class ManageSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        responses={200: ManageSubscriptionSerializer},
        description="Return the Apple URL where the user can manage or cancel their subscription.",
    )
    def get(self, request):
        return Response({"manage_url": APPLE_MANAGE_SUBSCRIPTION_URL})


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
