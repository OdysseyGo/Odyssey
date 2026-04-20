from django.db import transaction
from django.utils import timezone
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.gamification.models import Badge, TourProgress, UserBadge
from apps.gamification.services import BadgeService
from apps.tours.models import TourStep

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

    def get_queryset(self):
        return TourProgress.objects.filter(user=self.request.user).order_by(
            "-started_at"
        )

    def perform_create(self, serializer):
        user = self.request.user

        # Check if the user already has an active tour
        active_progress = (
            TourProgress.objects.filter(user=user, status=TourProgress.IN_PROGRESS)
            .select_related("tour")
            .first()
        )

        if active_progress:
            # If the referenced tour is gone/unreachable, the progress is orphaned —
            # clean it up silently and let the user proceed.
            if active_progress.tour_id is None or active_progress.tour is None:
                active_progress.delete()
            else:
                raise ValidationError(
                    {
                        "error": "You already have a tour in progress.",
                        "active_tour_id": active_progress.tour_id,
                        "progress_id": active_progress.id,
                    }
                )

        # If no active tour, create the new one normally
        tour = serializer.validated_data["tour"]
        first_step = TourStep.objects.filter(tour=tour).order_by("order").first()

        serializer.save(
            user=user,
            current_step=first_step,
            status=TourProgress.IN_PROGRESS,
        )

    @action(detail=True, methods=["post"], url_path="complete-step")
    def complete_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step

        # find the next step in the sequence with an order higher than the current one
        next_step = None
        if current_step:
            next_step = (
                TourStep.objects.filter(
                    tour=progress.tour,
                    order__gt=current_step.order,  # get steps with higher order
                )
                .order_by("order")
                .first()
            )

        # accumulate xp into total
        if current_step and hasattr(current_step, "puzzle"):
            progress.total_xp += current_step.puzzle.xp_reward

        with transaction.atomic():
            if next_step:
                progress.current_step = next_step
                progress.save()
                message = "Step completed. Moved to next step."
            else:
                progress.status = TourProgress.COMPLETED
                progress.completed_at = timezone.now()
                progress.current_step = None
                progress.save()

                user = request.user
                user.xp += progress.total_xp
                user.tour_count += 1
                user.save()

                # new_badges = BadgeService.check_badges(user)
                BadgeService.check_badges(user)
                message = "Tour completed!"

        return Response(
            {
                "status": message,
                "is_tour_complete": progress.status == TourProgress.COMPLETED,
                "new_step_id": next_step.id if next_step else None,
            }
        )

    @action(detail=True, methods=["post"], url_path="skip-step")
    def skip_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step

        # find the next step in the sequence with an order higher than the current one
        next_step = None
        if current_step:
            next_step = (
                TourStep.objects.filter(
                    tour=progress.tour,
                    order__gt=current_step.order,  # get steps with higher order
                )
                .order_by("order")
                .first()
            )

        # dont accumulate xp, no xp given when skipping!

        with transaction.atomic():
            progress.skip_count += 1

            if next_step:
                progress.current_step = next_step
                progress.save()
                message = "Step skipped. Moved to next step."

            else:
                progress.status = TourProgress.COMPLETED
                progress.completed_at = timezone.now()
                progress.current_step = None
                progress.save()

                user = request.user
                user.xp += progress.total_xp
                user.tour_count += 1
                user.save()

                # new_badges = BadgeService.check_badges(user)
                BadgeService.check_badges(user)
                message = "Tour completed!"

        return Response(
            {
                "status": message,
                "is_tour_complete": progress.status == TourProgress.COMPLETED,
                "new_step_id": next_step.id if next_step else None,
            }
        )

    @action(detail=False, methods=["get"], url_path="in-progress")
    def get_in_progress(self, request):
        active_progress = (
            TourProgress.objects.filter(
                user=request.user, status=TourProgress.IN_PROGRESS
            )
            .select_related("tour")
            .first()
        )

        # Self-heal orphan progress whose tour is gone/unreachable.
        if active_progress and (
            active_progress.tour_id is None or active_progress.tour is None
        ):
            active_progress.delete()
            active_progress = None

        if not active_progress:
            return Response({"detail": "No active tour found."}, status=200)

        serializer = self.get_serializer(active_progress)
        return Response(serializer.data)
