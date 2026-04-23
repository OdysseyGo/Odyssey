from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DeviceToken
from .serializers import DeviceTokenSerializer

class DeviceTokenViewSet(viewsets.ModelViewSet):
    serializer_class = DeviceTokenSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DeviceToken.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def register_token(self, request):
        """Register device token for push notifications"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Update or create token
        device_token, created = DeviceToken.objects.update_or_create(
            device_token=serializer.validated_data['device_token'],
            defaults={
                'user': request.user,
                'platform': serializer.validated_data['platform'],
                'is_active': True
            }
        )
        
        return Response(
            DeviceTokenSerializer(device_token).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )