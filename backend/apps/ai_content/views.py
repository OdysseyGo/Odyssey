import logging
import threading

from django.conf import settings
from django.db import close_old_connections, transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .errors import get_generation_error_message
from .models import GenerationJob
from .serializers import (
    GenerateTourRequestSerializer,
    GenerationJobAcceptedSerializer,
    GenerationJobSerializer,
)
from .services import GeminiService

logger = logging.getLogger(__name__)


class GenerateTourRateThrottle(ScopedRateThrottle):
    scope = "ai_generation"


def _run_generation(job_id, payload, user_id):
    from django.contrib.auth import get_user_model

    close_old_connections()
    User = get_user_model()
    try:
        job = GenerationJob.objects.get(pk=job_id)
        if job.status != GenerationJob.PENDING:
            return
        user = User.objects.get(pk=user_id)
        job.status = GenerationJob.RUNNING
        job.save(update_fields=["status", "updated_at"])

        def _progress(label):
            GenerationJob.objects.filter(
                pk=job_id, status=GenerationJob.RUNNING
            ).update(progress_label=label, updated_at=timezone.now())

        service = GeminiService()
        tour = service.generate_tour(
            city=payload["city"],
            country=payload.get("country", ""),
            country_code=payload.get("country_code", ""),
            theme=payload["theme"],
            mode=payload["mode"],
            duration=payload["duration"],
            language=payload["language"],
            custom_prompt=payload.get("additional_details", ""),
            include_ar=payload.get("include_ar", False),
            include_compass=payload.get("include_compass", False),
            creator=user,
            progress_callback=_progress,
        )
        tour_id = getattr(tour, "pk", None)
        if tour_id is None:
            raise ValueError("AI generation did not return a persisted tour.")
        updated = GenerationJob.objects.filter(
            pk=job_id, status=GenerationJob.RUNNING
        ).update(
            status=GenerationJob.SUCCESS,
            tour_id=tour_id,
            progress_label="",
            updated_at=timezone.now(),
        )
        if not updated:
            job.refresh_from_db()
            logger.info(
                "AI generation job %s finished after status changed to %s",
                job_id,
                job.status,
            )
    except Exception as e:
        logger.exception("AI generation job %s failed", job_id)
        GenerationJob.objects.filter(
            pk=job_id, status__in=[GenerationJob.PENDING, GenerationJob.RUNNING]
        ).update(
            status=GenerationJob.FAILED,
            error=get_generation_error_message(e),
            updated_at=timezone.now(),
        )
    finally:
        close_old_connections()


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
    permission_classes = [IsAuthenticated]
    throttle_classes = [GenerateTourRateThrottle]
    throttle_scope = "ai_generation"

    @extend_schema(
        request=GenerateTourRequestSerializer,
        responses={202: GenerationJobAcceptedSerializer},
        description="Start an AI tour generation job. Poll /api/ai/jobs/<id>/ for status.",
    )
    def post(self, request):
        from django.contrib.auth import get_user_model

        serializer = GenerateTourRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        active_job_count = GenerationJob.objects.filter(
            creator=request.user,
            status__in=[GenerationJob.PENDING, GenerationJob.RUNNING],
        ).count()
        max_active_jobs = getattr(settings, "AI_GENERATION_MAX_ACTIVE_JOBS", 1)
        if active_job_count >= max_active_jobs:
            return Response(
                {
                    "error": (
                        "You already have a tour generation in progress. "
                        "Please wait for it to finish before starting another."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )

        if not serializer.validated_data.get("use_ad_slot"):
            return Response(
                {"error": "Watch a rewarded ad before generating an AI tour."},
                status=status.HTTP_403_FORBIDDEN,
            )

        User = get_user_model()
        with transaction.atomic():
            # Serialize generation starts per user to enforce max-active-jobs
            # consistently under concurrent requests.
            User.objects.select_for_update().get(pk=request.user.pk)
            active_job_count = GenerationJob.objects.filter(
                creator=request.user,
                status__in=[GenerationJob.PENDING, GenerationJob.RUNNING],
            ).count()
            if active_job_count >= max_active_jobs:
                return Response(
                    {
                        "error": (
                            "You already have a tour generation in progress. "
                            "Please wait for it to finish before starting another."
                        )
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if not _consume_ai_slot_grant(request.user):
                return Response(
                    {
                        "error": (
                            "No unconsumed AI_SLOT reward available. "
                            "Watch a rewarded ad first or wait a few seconds for "
                            "verification."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            job = GenerationJob.objects.create(creator=request.user)

        threading.Thread(
            target=_run_generation,
            args=(job.id, dict(serializer.validated_data), request.user.id),
            name=f"ai-gen-{job.id}",
            daemon=True,
        ).start()

        return Response(
            {"job_id": str(job.id), "status": job.status},
            status=status.HTTP_202_ACCEPTED,
        )


class GenerationJobView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = GenerationJobSerializer
    lookup_field = "id"

    def get_queryset(self):
        return GenerationJob.objects.filter(creator=self.request.user)


class CancelGenerationJobView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        responses={200: GenerationJobSerializer},
        description="Mark an in-flight AI generation job as cancelled.",
    )
    def post(self, request, id):
        try:
            job = GenerationJob.objects.get(pk=id, creator=request.user)
        except GenerationJob.DoesNotExist:
            return Response(
                {"error": "Generation job not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if job.status in [GenerationJob.SUCCESS, GenerationJob.FAILED]:
            return Response(
                {"error": "This generation job has already finished."},
                status=status.HTTP_409_CONFLICT,
            )

        if job.status != GenerationJob.CANCELLED:
            job.status = GenerationJob.CANCELLED
            job.progress_label = ""
            job.error = "Tour generation was cancelled."
            job.save(update_fields=["status", "progress_label", "error", "updated_at"])

        return Response(GenerationJobSerializer(job).data, status=status.HTTP_200_OK)
