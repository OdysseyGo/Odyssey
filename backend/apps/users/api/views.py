from django.db.models import QuerySet
from rest_framework.viewsets import ModelViewSet, GenericViewSet
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets

from apps.users.models import User, Follow, Admin
from .serializers import UserSerializer, FollowSerializer, AdminSerializer


class UserViewSet(ModelViewSet):
    queryset: QuerySet[User] = User.objects.all().order_by("id")
    serializer_class = UserSerializer

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="followers")
    def followers(self, request, pk=None):
        user = self.get_object()
        followers_qs = User.objects.filter(
            followees__followee=user,
        ).distinct()

        serializer = self.get_serializer(followers_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="followees")
    def followees(self, request, pk=None):
        user = self.get_object()
        followees_qs = User.objects.filter(
            followers__follower=user,
        ).distinct()

        serializer = self.get_serializer(followees_qs, many=True)
        return Response(serializer.data)


class FollowViewSet(CreateModelMixin, DestroyModelMixin, GenericViewSet):
    queryset: QuerySet[Follow] = Follow.objects.select_related(
        "follower",
        "followee",
    )
    serializer_class = FollowSerializer

    def perform_create(self, serializer):
        serializer.save(follower=self.request.user)


class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all().order_by("admin_id")
    serializer_class = AdminSerializer
