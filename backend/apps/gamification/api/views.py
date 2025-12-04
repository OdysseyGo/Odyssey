from rest_framework import viewsets, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.gamification.models import Badge, UserBadge, TourProgress
from apps.tours.models import TourStep
from .serializers import BadgeSerializer, UserBadgeSerializer, TourProgressSerializer

class BadgeViewSet(mixins.CreateModelMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Badge.objects.all()
    serializer_class = BadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserBadgeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserBadgeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return UserBadge.objects.filter(user=self.request.user).order_by('-earned_at')

class TourProgressViewSet(mixins.CreateModelMixin,
                          mixins.ListModelMixin,
                          mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin,
                          viewsets.GenericViewSet):
    serializer_class = TourProgressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TourProgress.objects.filter(user=self.request.user).order_by('-started_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='complete-step')
    def complete_step(self, request, pk=None):
        progress = self.get_object()
        step_id = request.data.get('step_id')

        if not step_id:
            return Response({'error': 'step_id is required'}, status=400)

        try:
            step = TourStep.objects.get(id=step_id, tour=progress.tour)
        except TourStep.DoesNotExist:
            return Response({'error': 'Invalid step for this tour'}, status=400)

        # Update progress
        progress.current_step = step
        progress.save()

        # Award XP if puzzle exists
        xp_awarded = 0
        if hasattr(step, 'puzzle'):
            user = request.user
            user.xp += step.puzzle.xp_reward
            user.save()
            xp_awarded = step.puzzle.xp_reward

        # Check for new badges
        from apps.gamification.services import BadgeService
        new_badges = BadgeService.check_badges(request.user)
            
        return Response({
            'status': 'Step completed', 
            'xp_awarded': xp_awarded,
            'new_badges': new_badges
        })
