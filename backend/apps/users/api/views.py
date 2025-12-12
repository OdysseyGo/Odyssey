from django.contrib.auth import authenticate  # login direkt
from django.db.models import QuerySet, F # F dbden çıkarmadan yazıyon 
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken  # login token

from apps.users.models import Admin, Follow, User

from .serializers import AdminSerializer, FollowSerializer, UserSerializer


class UserViewSet(ModelViewSet):
    queryset: QuerySet[User] = User.objects.all().order_by("id")
    serializer_class = UserSerializer

    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({"detail": "Invalid credentials"}, status=400)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                # "user": UserSerializer(user).data,
            }
        )

    @action(detail=False, methods=["post"], url_path="refresh_token")
    def refresh_token(self, request):
        refresh_token = request.data.get("refresh")

        if not refresh_token:
            return Response({"detail": "Refresh token missing"}, status=400)

        try:
            refresh = RefreshToken(refresh_token)
            new_access = str(refresh.access_token)

            return Response({"access": new_access})
        except Exception:
            return Response({"detail": "Invalid refresh token"}, status=400)

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
        follow = serializer.save(follower=self.request.user)
        # increment counters 
        User.objects.filter(id=follow.followee_id).update(
            follower_count=F('follower_count') + 1
        )
        User.objects.filter(id=follow.follower_id).update(
            follow_count=F('follow_count') + 1
        )

    def perform_destroy(self, instance):
        # decrement counters safely on unfollow
        User.objects.filter(id=instance.followee_id).update(
            follower_count=F('follower_count') - 1
        )
        User.objects.filter(id=instance.follower_id).update(
            follow_count=F('follow_count') - 1
        )

        instance.delete()    


class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all().order_by("admin_id")
    serializer_class = AdminSerializer
