from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import GenerateTourRequestSerializer, GenerateTourResponseSerializer
from .services import GeminiService


def _consume_ai_slot_grant(user):
    """Find and consume the user's most recent unconsumed AI_SLOT grant.

    Returns True if a grant was consumed, False if none was found.
    """
    from apps.ads.models import RewardedAdGrant
    from apps.ads.services import reward_service

    grant = (
        RewardedAdGrant.objects.filter(
            user=user,
            reward_type=RewardedAdGrant.AI_SLOT,
            consumed_at__isnull=True,
        )
        .order_by("-granted_at")
        .first()
    )
    if grant is None:
        return False
    return reward_service.consume(grant, context={"source": "ai_generate_tour"})


class GenerateTourView(APIView):
    """API endpoint for AI generated tours"""

    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=GenerateTourRequestSerializer,
        responses={201: GenerateTourResponseSerializer},
        description="Generate an AI-powered tour based on city, theme, and mode.",
    )
    def post(self, request):
        serializer = GenerateTourRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if serializer.validated_data.get("use_ad_slot"):
            if not _consume_ai_slot_grant(request.user):
                return Response(
                    {
                        "error": (
                            "No unconsumed AI_SLOT reward available. "
                            "Watch a rewarded ad first or wait a few seconds for "
                            "verification."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            service = GeminiService()
            tour = service.generate_tour(
                city=serializer.validated_data["city"],
                theme=serializer.validated_data["theme"],
                mode=serializer.validated_data["mode"],
                duration=serializer.validated_data["duration"],
                language=serializer.validated_data["language"],
                custom_prompt=serializer.validated_data.get("custom_prompt", ""),
                creator=request.user,
            )

            return Response(
                {
                    "tour_id": tour.id,
                    "title": tour.title,
                    "message": f"Tour '{tour.title}' generated successfully with {tour.steps.count()} steps!",
                },
                status=status.HTTP_201_CREATED,
            )

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": f"AI generation failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
