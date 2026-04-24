from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.gamification.models import Badge, TourProgress, UserBadge
from apps.gamification.services import BadgeService
from apps.tours.api.serializers import TourSerializer

from .serializers import BadgeSerializer, TourProgressSerializer, UserBadgeSerializer


def _find_step(snapshot, step_id):
    """Return (step, index) in the snapshot for the given step id, or (None, -1)."""
    if not snapshot or step_id is None:
        return None, -1
    for idx, step in enumerate(snapshot.get("steps", [])):
        if step.get("id") == step_id:
            return step, idx
    return None, -1


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

    def get_queryset(self):
        return TourProgress.objects.filter(user=self.request.user).order_by(
            "-started_at"
        )

    def perform_create(self, serializer):
        user = self.request.user

        active_progress = TourProgress.objects.filter(
            user=user, status=TourProgress.IN_PROGRESS
        ).first()

        if active_progress:
            raise ValidationError(
                {
                    "error": "You already have a tour in progress.",
                    "active_tour_id": active_progress.tour_id,
                    "progress_id": active_progress.id,
                }
            )

        tour = serializer.validated_data["tour"]
        snapshot = TourSerializer(tour, context={"request": self.request}).data
        first_step_id = snapshot["steps"][0]["id"] if snapshot.get("steps") else None

        serializer.save(
            user=user,
            current_step_id=first_step_id,
            status=TourProgress.IN_PROGRESS,
            tour_snapshot=snapshot,
        )

    def _advance(self, progress, *, award_xp):
        """Shared step-advance logic for complete/skip. Returns (message, next_step_id)."""
        snapshot = progress.tour_snapshot or {}
        steps = snapshot.get("steps", [])
        current, idx = _find_step(snapshot, progress.current_step_id)

        next_step = steps[idx + 1] if 0 <= idx < len(steps) - 1 else None

        if award_xp and current and current.get("puzzle"):
            progress.total_xp += current["puzzle"].get("xp_reward", 0)

        with transaction.atomic():
            if next_step:
                progress.current_step_id = next_step["id"]
                progress.save()
                message = "Step completed. Moved to next step."
            else:
                progress.status = TourProgress.COMPLETED
                progress.completed_at = timezone.now()
                progress.current_step_id = None
                progress.save()

                user = progress.user
                user.xp += progress.total_xp
                user.tour_count += 1
                user.save()

                BadgeService.check_badges(user)
                message = "Tour completed!"

        return message, (next_step["id"] if next_step else None)

    @action(detail=True, methods=["post"], url_path="complete-step")
    def complete_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        message, new_step_id = self._advance(progress, award_xp=True)

        return Response(
            {
                "status": message,
                "is_tour_complete": progress.status == TourProgress.COMPLETED,
                "new_step_id": new_step_id,
            }
        )

    @action(detail=True, methods=["post"], url_path="skip-step")
    def skip_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        progress.skip_count += 1
        message, new_step_id = self._advance(progress, award_xp=False)

        return Response(
            {
                "status": message,
                "is_tour_complete": progress.status == TourProgress.COMPLETED,
                "new_step_id": new_step_id,
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
