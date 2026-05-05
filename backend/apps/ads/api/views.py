import logging
import uuid

from django.conf import settings
from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.ads.models import AdImpression, AdPlacement, RewardedAdGrant
from apps.ads.services import reward_service
from apps.ads.services.admob_ssv import SsvVerificationError, verify_ssv

from .serializers import (
    AdImpressionCreateSerializer,
    AdPlacementSerializer,
    ConsumeGrantSerializer,
    RewardedAdGrantSerializer,
)

logger = logging.getLogger(__name__)


def _platform_from_request(request):
    platform = request.query_params.get("platform") or request.data.get("platform")
    if platform in ("ios", "android"):
        return platform
    ua = request.META.get("HTTP_USER_AGENT", "").lower()
    if "android" in ua:
        return "android"
    return "ios"


class AdConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        platform = _platform_from_request(request)
        placements_qs = AdPlacement.objects.filter(enabled=True)
        placements_data = AdPlacementSerializer(
            placements_qs,
            many=True,
            context={"platform": platform, "user": request.user},
        ).data
        return Response({"placements": placements_data})


class AdImpressionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AdImpressionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        placement_key = serializer.validated_data["placement_key"]
        placement = get_object_or_404(AdPlacement, key=placement_key, enabled=True)

        if placement.frequency_cap_per_day > 0:
            today_start = timezone.now().replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            shown_today = AdImpression.objects.filter(
                user=request.user, placement=placement, shown_at__gte=today_start
            ).count()
            if shown_today >= placement.frequency_cap_per_day:
                return Response(
                    {"detail": "Frequency cap reached.", "code": "frequency_capped"},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        if placement.min_seconds_between > 0:
            last = (
                AdImpression.objects.filter(user=request.user, placement=placement)
                .order_by("-shown_at")
                .first()
            )
            if last is not None:
                delta = (timezone.now() - last.shown_at).total_seconds()
                if delta < placement.min_seconds_between:
                    return Response(
                        {
                            "detail": "Minimum interval not elapsed.",
                            "code": "interval_not_elapsed",
                        },
                        status=status.HTTP_429_TOO_MANY_REQUESTS,
                    )

        try:
            impression = AdImpression.objects.create(
                user=request.user,
                placement=placement,
                platform=serializer.validated_data["platform"],
                client_request_id=serializer.validated_data["client_request_id"],
            )
        except IntegrityError:
            # Idempotent replay
            impression = AdImpression.objects.get(
                client_request_id=serializer.validated_data["client_request_id"]
            )

        return Response(
            {"id": impression.id, "shown_at": impression.shown_at},
            status=status.HTTP_201_CREATED,
        )


class AdMobSsvView(APIView):
    """AdMob Server-Side Verification webhook.

    Public endpoint authenticated via Google's ECDSA signature. AdMob calls
    this URL with the reward parameters in the query string when a rewarded
    ad is fully watched. We verify the signature, identify the user via
    `custom_data` (set client-side as `<user_id>:<placement_key>`), and grant
    the reward idempotently.
    """

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        params = {k: v for k, v in request.query_params.items()}
        debug_snapshot = _ssv_debug_snapshot(request, params)
        logger.info("AdMob SSV callback received: %s", debug_snapshot)
        try:
            payload = verify_ssv(
                params,
                raw_query_string=request.META.get("QUERY_STRING", ""),
                request_path=request.path,
                request_url_base=request.build_absolute_uri(request.path),
            )
        except SsvVerificationError as e:
            logger.warning("AdMob SSV failed: %s | snapshot=%s", e, debug_snapshot)
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user_id, placement_key = _parse_custom_data(payload.custom_data)
        if not user_id or not placement_key:
            return Response(
                {"detail": "Malformed custom_data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.filter(pk=user_id).first()
        if user is None:
            return Response(
                {"detail": "Unknown user."}, status=status.HTTP_404_NOT_FOUND
            )

        placement = AdPlacement.objects.filter(key=placement_key, enabled=True).first()
        if placement is None:
            return Response(
                {"detail": "Unknown placement."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            grant_row, created = reward_service.grant(
                user=user,
                placement=placement,
                admob_transaction_id=payload.transaction_id,
                reward_amount=payload.reward_amount,
            )
        except reward_service.RewardServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "ok": True,
                "grant_id": grant_row.id,
                "created": created,
            },
            status=status.HTTP_200_OK,
        )


def _parse_custom_data(custom_data: str):
    if not custom_data or ":" not in custom_data:
        return None, None
    user_id, _, placement_key = custom_data.partition(":")
    return user_id.strip() or None, placement_key.strip() or None


def _ssv_debug_snapshot(request, params: dict):
    raw_query = request.META.get("QUERY_STRING", "")
    raw_parts = [p for p in raw_query.split("&") if p]
    raw_param_order = [p.split("=", 1)[0] for p in raw_parts]
    redacted_raw_parts = []
    for part in raw_parts:
        if part.startswith("signature="):
            redacted_raw_parts.append("signature=<redacted>")
        else:
            redacted_raw_parts.append(part)

    signature = params.get("signature", "")
    masked_signature = (
        f"{signature[:12]}...len={len(signature)}" if signature else "<missing>"
    )

    return {
        "path": request.path,
        "raw_query": "&".join(redacted_raw_parts),
        "raw_param_order": raw_param_order,
        "query_param_keys": list(params.keys()),
        "key_id": params.get("key_id", "<missing>"),
        "signature": masked_signature,
        "custom_data": params.get("custom_data", "<missing>"),
        "user_id": params.get("user_id", "<missing>"),
    }


class DevRewardGrantView(APIView):
    """DEBUG-only fallback for AdMob SSV.

    AdMob's SSV ping originates from Google's public servers and cannot reach
    a developer's LAN backend, so the grant row is never created and feature
    endpoints reject `use_ad_*` payloads. This endpoint lets an authenticated
    client mint the grant directly when EARNED_REWARD fires in dev. Refuses
    to run when DEBUG is False.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not settings.DEBUG:
            return Response(
                {"detail": "Not available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        placement_key = request.data.get("placement_key")
        if not placement_key:
            return Response(
                {"detail": "placement_key is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        placement = AdPlacement.objects.filter(key=placement_key, enabled=True).first()
        if placement is None:
            return Response(
                {"detail": "Unknown placement."},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            grant_row, created = reward_service.grant(
                user=request.user,
                placement=placement,
                admob_transaction_id=f"dev-{uuid.uuid4()}",
                reward_amount=placement.reward_amount,
            )
        except reward_service.RewardServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {"ok": True, "grant_id": grant_row.id, "created": created},
            status=status.HTTP_200_OK,
        )


class ConsumeGrantView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, grant_id):
        grant_row = get_object_or_404(RewardedAdGrant, pk=grant_id, user=request.user)
        if grant_row.reward_type == RewardedAdGrant.CREDITS:
            return Response(
                {"detail": "Credits rewards are auto-consumed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ConsumeGrantSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        consumed = reward_service.consume(
            grant_row, serializer.validated_data.get("context") or {}
        )
        if not consumed:
            return Response(
                {"detail": "Grant already consumed.", "code": "already_consumed"},
                status=status.HTTP_409_CONFLICT,
            )

        grant_row.refresh_from_db()
        return Response(
            RewardedAdGrantSerializer(grant_row).data, status=status.HTTP_200_OK
        )
