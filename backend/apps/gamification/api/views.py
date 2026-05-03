import math

from django.contrib.auth import get_user_model
from django.db import models, transaction
from django.utils import timezone
from PIL import UnidentifiedImageError
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.gamification.level_service import LevelService
from apps.gamification.models import (
    Badge,
    PictureCompareConfig,
    StepLocationConfirmation,
    TourProgress,
    UserBadge,
    UserBadgeHistory,
)
from apps.gamification.open_ended_similarity import (
    DEFAULT_OPEN_ENDED_SIMILARITY_THRESHOLD,
    is_open_ended_answer_accepted,
)
from apps.gamification.picture_compare import compare_picture_similarity
from apps.gamification.services import TourRewardService
from apps.tours.models import Puzzle, PuzzleAttempt, TourStep

from .serializers import (
    BadgeSerializer,
    TourProgressSerializer,
    UserBadgeHistorySerializer,
    UserBadgeSerializer,
)


class BadgeViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            UserBadge.objects.filter(user=self.request.user)
            .select_related("badge", "source_tour")
            .order_by("-earned_at")
        )


class UserBadgeHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserBadgeHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            UserBadgeHistory.objects.filter(user=self.request.user)
            .select_related("badge", "source_tour", "user_badge")
            .order_by("-earned_at")
        )


class TourProgressViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = TourProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    MAX_PICTURE_UPLOAD_BYTES = 5 * 1024 * 1024
    PICTURE_COMPARE_THRESHOLD = 0.7
    OPEN_ENDED_SIMILARITY_THRESHOLD = DEFAULT_OPEN_ENDED_SIMILARITY_THRESHOLD
    MAX_FAILED_ATTEMPTS = TourRewardService.AR_PICTURE_FAILURE_WINDOW
    LOCATION_CHECK_RADIUS_M = 100

    @staticmethod
    def _haversine_distance_m(lat1, lon1, lat2, lon2):
        earth_radius_m = 6371000.0
        lat1_rad = math.radians(float(lat1))
        lon1_rad = math.radians(float(lon1))
        lat2_rad = math.radians(float(lat2))
        lon2_rad = math.radians(float(lon2))

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return earth_radius_m * c

    @staticmethod
    def _is_location_confirmed(progress, step):
        return StepLocationConfirmation.objects.filter(progress=progress, step=step).exists()

    def _location_gate_error_response(self, progress):
        return Response(
            {
                "error": "Location confirmation is required before moving to the next step.",
                "requires_location_confirmation": True,
                "step_id": progress.current_step_id,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    @staticmethod
    def _picture_compare_config(puzzle):
        detail = getattr(puzzle, "picture_compare_detail", None)
        if detail is None:
            return None, None, None

        live_config = PictureCompareConfig.load()
        return (
            detail.reference_image,
            live_config.similarity_threshold,
            live_config.tuning_config(),
        )

    def get_queryset(self):
        return TourProgress.objects.filter(user=self.request.user).order_by(
            "-started_at"
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        tour = serializer.validated_data["tour"]
        first_step = TourStep.objects.filter(tour=tour).order_by("order").first()

        active_progress = TourProgress.objects.filter(
            user=user, status=TourProgress.IN_PROGRESS
        ).first()
        if active_progress and active_progress.tour_id != tour.id:
            return Response(
                {
                    "error": "You already have a tour in progress.",
                    "active_tour_id": active_progress.tour_id,
                    "progress_id": active_progress.id,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing_progress = TourProgress.objects.filter(user=user, tour=tour).first()

        if existing_progress and existing_progress.status == TourProgress.IN_PROGRESS:
            # Idempotent create for the same tour currently in progress.
            response_serializer = self.get_serializer(existing_progress)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        if existing_progress and existing_progress.status == TourProgress.COMPLETED:
            # Replay: reset completed progress instead of creating a duplicate row.
            with transaction.atomic():
                existing_progress.puzzle_attempts.all().delete()
                existing_progress.location_confirmations.all().delete()
                existing_progress.current_step = first_step
                existing_progress.status = TourProgress.IN_PROGRESS
                existing_progress.started_at = timezone.now()
                existing_progress.completed_at = None
                existing_progress.total_xp = 0
                existing_progress.skip_count = 0
                # Preserve one-time XP guarantee on replays, including legacy rows.
                existing_progress.xp_awarded = True
                existing_progress.wrong_attempt_count = 0
                existing_progress.save(
                    update_fields=[
                        "current_step",
                        "status",
                        "started_at",
                        "completed_at",
                        "total_xp",
                        "skip_count",
                        "xp_awarded",
                        "wrong_attempt_count",
                    ]
                )

            response_serializer = self.get_serializer(existing_progress)
            return Response(response_serializer.data, status=status.HTTP_200_OK)

        progress = serializer.save(
            user=user,
            current_step=first_step,
            status=TourProgress.IN_PROGRESS,
        )
        response_serializer = self.get_serializer(progress)
        headers = self.get_success_headers(response_serializer.data)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )

    def _get_next_step(self, progress):
        current_step = progress.current_step
        if not current_step:
            return None

        return (
            TourStep.objects.filter(
                tour=progress.tour,
                order__gt=current_step.order,
            )
            .order_by("order")
            .first()
        )

    def _advance_progress(
        self,
        *,
        progress,
        user,
        award_xp,
        step_action_word="completed",
        increment_skip_count=False,
    ):
        user_model = get_user_model()
        awarded_xp = 0
        awarded_badges = []

        with transaction.atomic():
            progress = TourProgress.objects.select_for_update().get(pk=progress.pk)

            if progress.status == TourProgress.COMPLETED:
                return {
                    "error": "Tour is already completed",
                    "status_code": status.HTTP_400_BAD_REQUEST,
                }

            if increment_skip_count:
                progress.skip_count += 1

            next_step = self._get_next_step(progress)

            if award_xp:
                progress.total_xp += TourRewardService.step_xp_for_completion(
                    progress=progress, user=user
                )

            if next_step:
                progress.current_step = next_step
                progress.save()
                message = f"Step {step_action_word}. Moved to next step."
            else:
                progress.status = TourProgress.COMPLETED
                progress.completed_at = timezone.now()
                progress.has_completed_once = True
                progress.current_step = None
                progress.save()

                locked_user = user_model.objects.select_for_update().get(pk=user.pk)
                latest_history_id = (
                    UserBadgeHistory.objects.filter(user=locked_user).aggregate(
                        max_id=models.Max("id")
                    )["max_id"]
                    or 0
                )
                awarded_xp = TourRewardService.apply_tour_completion_rewards(
                    progress=progress,
                    user=locked_user,
                )
                new_badge_ids = list(
                    UserBadgeHistory.objects.filter(
                        user=locked_user,
                        id__gt=latest_history_id,
                        user_badge__isnull=False,
                    )
                    .values_list("user_badge_id", flat=True)
                    .distinct()
                )
                if new_badge_ids:
                    awarded_badges = list(
                        UserBadge.objects.select_related("badge", "source_tour")
                        .filter(id__in=new_badge_ids)
                        .order_by("-earned_at")
                    )
                message = "Tour completed!"

        return {
            "status": message,
            "is_tour_complete": progress.status == TourProgress.COMPLETED,
            "new_step_id": next_step.id if next_step else None,
            "awarded_xp": awarded_xp,
            "awarded_badges": UserBadgeSerializer(awarded_badges, many=True).data,
        }

    @action(detail=True, methods=["post"], url_path="check-location")
    def check_location(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step
        if not current_step:
            return Response(
                {"error": "No current step is active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_id = request.data.get("step_id")
        if step_id is None:
            return Response(
                {"error": "step_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(step_id) != str(current_step.id):
            return Response(
                {"error": "step_id must match the current active step."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            submitted_lat = float(request.data.get("latitude"))
            submitted_lng = float(request.data.get("longitude"))
        except (TypeError, ValueError):
            return Response(
                {"error": "latitude and longitude must be valid numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        step_lat = float(current_step.latitude)
        step_lng = float(current_step.longitude)
        radius_m = self.LOCATION_CHECK_RADIUS_M
        distance_m = self._haversine_distance_m(submitted_lat, submitted_lng, step_lat, step_lng)
        accepted = distance_m <= radius_m

        if accepted:
            StepLocationConfirmation.objects.update_or_create(
                progress=progress,
                step=current_step,
                defaults={
                    "checked_latitude": submitted_lat,
                    "checked_longitude": submitted_lng,
                    "distance_m": distance_m,
                },
            )

        return Response(
            {
                "status": (
                    "Location confirmed. You can continue."
                    if accepted
                    else "You are outside the accepted area."
                ),
                "accepted": accepted,
                "step_id": current_step.id,
                "distance_m": round(distance_m, 2),
                "radius_m": radius_m,
            }
        )

    @staticmethod
    def _trivia_correct_answer(puzzle):
        detail = getattr(puzzle, "trivia_detail", None)
        if detail and detail.correct_answer:
            return detail.correct_answer
        return puzzle.correct_answer

    @action(detail=True, methods=["post"], url_path="complete-step")
    def complete_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step
        if current_step:
            if not self._is_location_confirmed(progress, current_step):
                return self._location_gate_error_response(progress)

        required_submission_type = (
            TourRewardService.requires_submission_before_completion(
                progress=progress,
                user=request.user,
            )
        )

        if required_submission_type == Puzzle.PICTURE_COMPARE:
            return Response(
                {
                    "error": (
                        "Picture compare puzzles require submit-picture-compare "
                        "verification before completion."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if required_submission_type == Puzzle.AR:
            return Response(
                {
                    "error": (
                        "AR puzzles require submit-ar-code verification "
                        "before completion."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if required_submission_type == Puzzle.TRIVIA:
            return Response(
                {
                    "error": (
                        "Trivia puzzles require submit-trivia-answer "
                        "verification before completion."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if required_submission_type == Puzzle.OPEN_ENDED:
            return Response(
                {
                    "error": (
                        "Open ended puzzles require submit-open-ended-answer "
                        "verification before completion."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = self._advance_progress(
            progress=progress, user=request.user, award_xp=True
        )
        if result.get("status_code"):
            return Response({"error": result["error"]}, status=result["status_code"])
        return Response(result)

    @action(detail=True, methods=["post"], url_path="submit-trivia-answer")
    def submit_trivia_answer(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return Response(
                {"error": "Current step does not have a puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        puzzle = current_step.puzzle
        if puzzle.puzzle_type != Puzzle.TRIVIA:
            return Response(
                {"error": "Current puzzle is not a TRIVIA puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        failed_count = PuzzleAttempt.objects.filter(
            progress=progress, puzzle=puzzle, accepted=False
        ).count()
        if failed_count > 0:
            return Response(
                {
                    "error": "Trivia answer has already been used.",
                    "accepted": False,
                    "attempt_count": failed_count,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        submitted_answer = str(request.data.get("answer", "")).strip()
        if not submitted_answer:
            return Response(
                {"error": "answer is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        correct_answer = self._trivia_correct_answer(puzzle).strip()
        accepted = submitted_answer.casefold() == correct_answer.casefold()
        PuzzleAttempt.objects.create(
            puzzle=puzzle,
            user=request.user,
            progress=progress,
            accepted=accepted,
        )

        if not accepted:
            failed_count = PuzzleAttempt.objects.filter(
                progress=progress, puzzle=puzzle, accepted=False
            ).count()
            TourProgress.objects.filter(pk=progress.pk).update(
                wrong_attempt_count=models.F("wrong_attempt_count") + 1
            )

        return Response(
            {
                "status": (
                    "Answer verified. You can continue."
                    if accepted
                    else "Answer is not correct. Try again."
                ),
                "accepted": accepted,
                "is_tour_complete": False,
                "new_step_id": current_step.id,
                **({"attempt_count": failed_count} if failed_count is not None else {}),
            }
        )

    @action(detail=True, methods=["post"], url_path="submit-open-ended-answer")
    def submit_open_ended_answer(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return Response(
                {"error": "Current step does not have a puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        puzzle = current_step.puzzle
        if puzzle.puzzle_type != Puzzle.OPEN_ENDED:
            return Response(
                {"error": "Current puzzle is not an OPEN_ENDED puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        failed_count = PuzzleAttempt.objects.filter(
            progress=progress, puzzle=puzzle, accepted=False
        ).count()
        if failed_count >= self.MAX_FAILED_ATTEMPTS:
            return Response(
                {
                    "error": "Open ended answer attempts are exhausted.",
                    "accepted": False,
                    "attempt_count": failed_count,
                    "max_attempts": self.MAX_FAILED_ATTEMPTS,
                    "revealed_answer": puzzle.correct_answer,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        submitted_answer = str(request.data.get("answer", "")).strip()
        if not submitted_answer:
            return Response(
                {"error": "answer is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accepted, similarity_score = is_open_ended_answer_accepted(
            submitted_answer=submitted_answer,
            correct_answer=puzzle.correct_answer,
            threshold=self.OPEN_ENDED_SIMILARITY_THRESHOLD,
        )
        PuzzleAttempt.objects.create(
            puzzle=puzzle,
            user=request.user,
            progress=progress,
            accepted=accepted,
            similarity_score=similarity_score,
        )

        if not accepted:
            failed_count += 1
            if failed_count == self.MAX_FAILED_ATTEMPTS:
                TourProgress.objects.filter(pk=progress.pk).update(
                    wrong_attempt_count=models.F("wrong_attempt_count") + 1
                )

        return Response(
            {
                "status": (
                    "Answer verified. You can continue."
                    if accepted
                    else "Answer is not close enough. Try again."
                ),
                "accepted": accepted,
                "similarity_score": round(similarity_score, 4),
                "threshold_used": self.OPEN_ENDED_SIMILARITY_THRESHOLD,
                "is_tour_complete": False,
                "new_step_id": current_step.id,
                "max_attempts": self.MAX_FAILED_ATTEMPTS,
                **(
                    {"revealed_answer": puzzle.correct_answer}
                    if not accepted and failed_count >= self.MAX_FAILED_ATTEMPTS
                    else {}
                ),
                **({"attempt_count": failed_count} if not accepted else {}),
            }
        )

    @action(detail=True, methods=["post"], url_path="skip-step")
    def skip_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        used_ad_skip = False
        if request.data.get("use_ad_skip"):
            used_ad_skip = self._consume_hint_grant(request.user)
            if not used_ad_skip:
                return Response(
                    {
                        "error": (
                            "No unconsumed HINT reward available. "
                            "Watch a rewarded ad first or wait a few seconds for "
                            "verification."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        result = self._advance_progress(
            progress=progress,
            user=request.user,
            award_xp=False,
            step_action_word="skipped",
            increment_skip_count=(
                (not used_ad_skip)
                and TourRewardService.skip_counts_as_badge_mistake(progress=progress)
            ),
        )
        if result.get("status_code"):
            return Response({"error": result["error"]}, status=result["status_code"])
        return Response(result)

    @staticmethod
    def _consume_hint_grant(user):
        from apps.ads.models import RewardedAdGrant
        from apps.ads.services import reward_service

        grant = (
            RewardedAdGrant.objects.filter(
                user=user,
                reward_type=RewardedAdGrant.HINT,
                consumed_at__isnull=True,
            )
            .order_by("-granted_at")
            .first()
        )
        if grant is None:
            return False
        return reward_service.consume(grant, context={"source": "skip_step"})

    @action(detail=True, methods=["post"], url_path="submit-picture-compare")
    def submit_picture_compare(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return Response(
                {"error": "Current step does not have a puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        puzzle = current_step.puzzle
        if puzzle.puzzle_type != Puzzle.PICTURE_COMPARE:
            return Response(
                {"error": "Current puzzle is not a PICTURE_COMPARE puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reference_image, threshold, tuning_config = self._picture_compare_config(puzzle)
        if not reference_image:
            return Response(
                {"error": "Reference image is not configured for this puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt_image = request.FILES.get("image") or request.FILES.get("attempt_image")
        if not attempt_image:
            return Response(
                {"error": "Provide an image file in 'image' or 'attempt_image'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if attempt_image.size > self.MAX_PICTURE_UPLOAD_BYTES:
            return Response(
                {
                    "error": "Image exceeds size limit.",
                    "max_bytes": self.MAX_PICTURE_UPLOAD_BYTES,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            similarity_result = compare_picture_similarity(
                reference_image_file=reference_image,
                attempt_image_file=attempt_image,
                threshold=threshold,
                tuning_config=tuning_config,
            )
        except (OSError, UnidentifiedImageError, ValueError):
            return Response(
                {"error": "Invalid or unreadable image data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attempt = PuzzleAttempt.objects.create(
            puzzle=puzzle,
            user=request.user,
            progress=progress,
            similarity_score=similarity_result["similarity_score"],
            accepted=similarity_result["accepted"],
            processing_ms=similarity_result["processing_ms"],
        )

        if attempt.accepted:
            return Response(
                {
                    "status": "Picture verified. You can continue.",
                    "accepted": True,
                    "similarity_score": attempt.similarity_score,
                    "threshold_used": threshold,
                    "processing_ms": attempt.processing_ms,
                    "is_tour_complete": False,
                    "new_step_id": current_step.id,
                    "max_attempts": self.MAX_FAILED_ATTEMPTS,
                }
            )

        failed_count = PuzzleAttempt.objects.filter(
            progress=progress, puzzle=puzzle, accepted=False
        ).count()
        if failed_count == self.MAX_FAILED_ATTEMPTS:
            TourProgress.objects.filter(pk=progress.pk).update(
                wrong_attempt_count=models.F("wrong_attempt_count") + 1
            )

        return Response(
            {
                "status": "Picture did not match closely enough.",
                "accepted": False,
                "similarity_score": attempt.similarity_score,
                "threshold_used": threshold,
                "processing_ms": attempt.processing_ms,
                "is_tour_complete": False,
                "new_step_id": current_step.id,
                "max_attempts": self.MAX_FAILED_ATTEMPTS,
                "attempt_count": failed_count,
            }
        )

    @action(detail=True, methods=["post"], url_path="submit-ar-code")
    def submit_ar_code(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return Response(
                {"error": "Current step does not have a puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        puzzle = current_step.puzzle
        if puzzle.puzzle_type != Puzzle.AR:
            return Response(
                {"error": "Current puzzle is not an AR puzzle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        detail = getattr(puzzle, "ar_detail", None)
        metadata = detail.metadata if detail else {}
        expected_code = (
            str(metadata.get("secret_code")).strip()
            if isinstance(metadata, dict) and metadata.get("secret_code") is not None
            else ""
        )
        if not expected_code:
            return Response(
                {"error": "AR puzzle secret code is not configured."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        submitted_code = str(request.data.get("code", "")).strip()
        if not submitted_code:
            return Response(
                {"error": "code is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        accepted = submitted_code.upper() == expected_code.upper()
        PuzzleAttempt.objects.create(
            puzzle=puzzle,
            user=request.user,
            progress=progress,
            accepted=accepted,
        )

        failed_count = None
        if not accepted:
            failed_count = PuzzleAttempt.objects.filter(
                progress=progress, puzzle=puzzle, accepted=False
            ).count()
            if failed_count == self.MAX_FAILED_ATTEMPTS:
                TourProgress.objects.filter(pk=progress.pk).update(
                    wrong_attempt_count=models.F("wrong_attempt_count") + 1
                )

        return Response(
            {
                "status": (
                    "Code verified. You can continue."
                    if accepted
                    else "Code does not match. Try again."
                ),
                "accepted": accepted,
                "is_tour_complete": False,
                "new_step_id": current_step.id,
                "max_attempts": self.MAX_FAILED_ATTEMPTS,
                **({"attempt_count": failed_count} if failed_count is not None else {}),
            }
        )

    @action(detail=False, methods=["get"], url_path="in-progress")
    def get_in_progress(self, request):
        active_progress = TourProgress.objects.filter(
            user=request.user, status=TourProgress.IN_PROGRESS
        ).first()

        if not active_progress:
            return Response({"detail": "No active tour found."}, status=200)

        serializer = self.get_serializer(active_progress)
        return Response(serializer.data)


class LevelInfoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(LevelService.get_level_info(request.user.xp))
