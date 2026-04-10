from django.contrib.auth import authenticate  # login direkt
from django.db.models import F, QuerySet  # F dbden çıkarmadan yazıyon
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin, DestroyModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet
from rest_framework_simplejwt.tokens import RefreshToken  # login token

from apps.users.models import Follow, User

from .serializers import FollowSerializer, UserSerializer


class UserViewSet(ModelViewSet):
    queryset: QuerySet[User] = User.objects.all().order_by("id")
    serializer_class = UserSerializer

    @action(detail=False, methods=["get"], url_path="get-by-username")
    def get_by_username(self, request):
        username = request.query_params.get("username")
        if not username:
            return Response({"error": "username is required"}, status=400)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        return Response(
            {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        )

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

    @action(detail=False, methods=["post"], url_path="refresh-token")
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

    @action(detail=False, methods=["patch"], url_path="me/avatar")
    def update_avatar(self, request):
        user = request.user
        avatar_url = request.data.get("avatar_url", "")
        user.avatar_url = avatar_url
        user.save(update_fields=["avatar_url"])
        return Response({"avatar_url": user.avatar_url})

    @action(detail=True, methods=["get"], url_path="followers")
    def followers(self, request, pk=None):
        user = self.get_object()
        followers_qs = User.objects.filter(
            followings__following=user,
        ).distinct()

        serializer = self.get_serializer(followers_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"], url_path="followings")
    def followings(self, request, pk=None):
        user = self.get_object()
        followings_qs = User.objects.filter(
            followers__follower=user,
        ).distinct()

        serializer = self.get_serializer(followings_qs, many=True)
        return Response(serializer.data)

    @action(
        detail=False, methods=["post"], url_path="reset-password"
    )  # This is for the demo, no auth password changing!!!
    def reset_password(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        new_password = request.data.get("new_password")

        if not username or not email or not new_password:
            return Response(
                {"detail": "username, email and new_password required"}, status=400
            )

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)

        if user.email.lower() != email.lower():
            return Response({"detail": "Username and email do not match"}, status=400)

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password updated successfully"}, status=200)

    @action(
        detail=False, methods=["get"], url_path="get-filtered-users-add-friend"
    )  # filter by username to add friend (excludes itself and already following)
    def get_filtered_users_add_friend(self, request):
        filter = request.query_params.get("filter")
        if not filter:
            return Response({"error": "filter is required"}, status=400)

        current_user = request.user

        following_ids = Follow.objects.filter(follow=current_user).values_list(
            "follow_id", flat=True
        )

        print(following_ids)

        users = (
            User.objects.filter(username__icontains=filter)
            .exclude(id=current_user.id)
            .exclude(id__in=following_ids)
        )

        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)


class FollowViewSet(CreateModelMixin, DestroyModelMixin, GenericViewSet):
    serializer_class = FollowSerializer

    lookup_field = "follow_id"

    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user).select_related(
            "following"
        )

    def perform_create(self, serializer):
        follow = serializer.save(follower=self.request.user)
        # increment counters
        User.objects.filter(id=follow.follow_id).update(
            follower_count=F("follower_count") + 1
        )
        User.objects.filter(id=follow.follower_id).update(
            following_count=F("following_count") + 1
        )

    def perform_destroy(self, instance):
        # decrement counters safely on unfollow
        User.objects.filter(id=instance.follow_id).update(
            follower_count=F("follower_count") - 1
        )
        User.objects.filter(id=instance.follower_id).update(
            following_count=F("following_count") - 1
        )

        instance.delete()
