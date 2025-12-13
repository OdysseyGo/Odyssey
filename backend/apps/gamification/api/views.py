from django.utils import timezone
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
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
    viewsets.GenericViewSet,
):
    serializer_class = TourProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TourProgress.objects.filter(user=self.request.user).order_by(
            "-started_at"
        )

    def perform_create(self, serializer):
        # auto assign the first step when the tour starts
        tour = serializer.validated_data["tour"]
        first_step = TourStep.objects.filter(tour=tour).order_by("order").first()

        serializer.save(
            user=self.request.user,
            current_step=first_step,
            status=TourProgress.IN_PROGRESS,
        )

    @action(detail=True, methods=["post"], url_path="complete-step")
    def complete_step(self, request, pk=None):
        progress = self.get_object()

        if progress.status == TourProgress.COMPLETED:
            return Response({"error": "Tour is already completed"}, status=400)

        current_step = progress.current_step

        # award xp for the CURRENT step
        xp_awarded = 0
        if current_step and hasattr(current_step, "puzzle"):
            user = request.user
            user.xp += current_step.puzzle.xp_reward
            user.save()
            xp_awarded = current_step.puzzle.xp_reward

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

        if next_step:
            progress.current_step = next_step
            progress.save()
            message = "Step completed. Moved to next step."
        else:
            progress.status = TourProgress.COMPLETED
            progress.completed_at = timezone.now()
            progress.current_step = None  # if current step is null, its completed but also we have status so redundancy
            progress.save()

            # increment user's tour_count
            user = request.user
            user.tour_count += 1
            user.save()

            message = "Tour completed!"

        new_badges = BadgeService.check_badges(request.user)

        return Response(
            {
                "status": message,
                "is_tour_complete": progress.status == TourProgress.COMPLETED,
                "xp_awarded": xp_awarded,
                "new_step_id": next_step.id if next_step else None,
                "new_badges": new_badges,
            }
        )
