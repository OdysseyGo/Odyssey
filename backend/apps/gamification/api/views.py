from django.db import transaction
from django.utils import timezone
from PIL import UnidentifiedImageError
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.gamification.models import (
    Badge,
    PictureCompareConfig,
    TourProgress,
    UserBadge,
)
from apps.gamification.picture_compare import compare_picture_similarity
from apps.gamification.services import BadgeService
from apps.tours.models import Puzzle, PuzzleAttempt, TourStep

from .serializers import BadgeSerializer, TourProgressSerializer, UserBadgeSerializer


class BadgeViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).order_by("-earned_at")


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
            raise ValidationError(
                {
                    "error": "You already have a tour in progress.",
                    "active_tour_id": active_progress.tour_id,
                    "progress_id": active_progress.id,
                }
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
                existing_progress.current_step = first_step
                existing_progress.status = TourProgress.IN_PROGRESS
                existing_progress.started_at = timezone.now()
                existing_progress.completed_at = None
                existing_progress.total_xp = 0
                existing_progress.skip_count = 0
                existing_progress.save(
                    update_fields=[
                        "current_step",
                        "status",
                        "started_at",
                        "completed_at",
                        "total_xp",
                        "skip_count",
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
        self, *, progress, user, award_xp, step_action_word="completed"
    ):
        current_step = progress.current_step
        next_step = self._get_next_step(progress)

        if award_xp and current_step and hasattr(current_step, "puzzle"):
            progress.total_xp += current_step.puzzle.xp_reward

        with transaction.atomic():
            if next_step:
                progress.current_step = next_step
                progress.save()
                message = f"Step {step_action_word}. Moved to next step."
            else:
                progress.status = TourProgress.COMPLETED
                progress.completed_at = timezone.now()
                progress.current_step = None
                progress.save()

                user.xp += progress.total_xp
                user.tour_count += 1
                user.save()

                BadgeService.check_badges(user, completed_progress=progress)
                message = "Tour completed!"

        return {
            "status": message,
            "is_tour_complete": progress.status == TourProgress.COMPLETED,
            "new_step_id": next_step.id if next_step else None,
        }

    def _requires_picture_compare_submission(self, progress):
        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return False

        puzzle = current_step.puzzle
        if puzzle.puzzle_type != Puzzle.PICTURE_COMPARE:
            return False

        return not PuzzleAttempt.objects.filter(
            user=progress.user,
            progress=progress,
            puzzle=puzzle,
            accepted=True,
        ).exists()

    def _requires_ar_code_submission(self, progress):
        current_step = progress.current_step
        if not current_step or not hasattr(current_step, "puzzle"):
            return False

        puzzle = current_step.puzzle
        if puzzle.puzzle_type != Puzzle.AR:
            return False

        return not PuzzleAttempt.objects.filter(
            user=progress.user,
            progress=progress,
            puzzle=puzzle,
            accepted=True,
        ).exists()

    @action(detail=True, methods=["post"], url_path="complete-step")
    def complete_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        if self._requires_picture_compare_submission(progress):
            return Response(
                {
                    "error": (
                        "Picture compare puzzles require submit-picture-compare "
                        "verification before completion."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if self._requires_ar_code_submission(progress):
            return Response(
                {
                    "error": (
                        "AR puzzles require submit-ar-code verification "
                        "before completion."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = self._advance_progress(
            progress=progress, user=request.user, award_xp=True
        )
        return Response(result)

    @action(detail=True, methods=["post"], url_path="skip-step")
    def skip_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        progress.skip_count += 1
        result = self._advance_progress(
            progress=progress,
            user=request.user,
            award_xp=False,
            step_action_word="skipped",
        )
        return Response(result)

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
                }
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
