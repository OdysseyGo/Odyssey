from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import DeviceToken
from .serializers import DeviceTokenSerializer
from .services import APNsService


class DeviceTokenViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)

    @action(detail=False, methods=["post"])
    def register_token(self, request):
        """Register device token for push notifications"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Update or create token
        device_token, created = DeviceToken.objects.update_or_create(
            device_token=serializer.validated_data["device_token"],
            defaults={
                "user": request.user,
                "platform": serializer.validated_data["platform"],
                "is_active": True,
            },
        )

        return Response(
            DeviceTokenSerializer(device_token).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"])
    def test_push(self, request, pk=None):
        """Trigger a test push notification to a specific saved token"""
        device_token_obj = self.get_object()

        apns = APNsService()
        alert = {
            "title": "Test Push",
            "body": "If you see this, the APNs integration is working!",
        }

        success = apns.send_notification(
            device_token=device_token_obj.device_token, alert_dict=alert, badge=1
        )

        if success:
            return Response(
                {"detail": "Test notification sent successfully."},
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {"detail": "Failed to send notification."},
                status=status.HTTP_400_BAD_REQUEST,
            )
