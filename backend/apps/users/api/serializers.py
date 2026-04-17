from rest_framework import serializers

from apps.tours.models import Tour
from apps.users.models.Follow import Follow
from apps.users.models.User import User
from apps.gamification.models import TourProgress


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "xp",
            "following_count",
            "follower_count",
            "credit",
            "level",
            "country",
            "user_type",
            "tour_count",
            "rating",
            "avatar_url",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["follow_id", "follower", "following"]
        read_only_fields = ["follower"]

    def validate(self, attrs):
        follower = self.context["request"].user
        following = attrs.get("following")
        if follower == following:
            raise serializers.ValidationError("A user cannot self follow.")
        if Follow.objects.filter(follower=follower, following=following).exists():
            raise serializers.ValidationError("Already following this user.")
        return attrs


class FollowingFeedSerializer(serializers.Serializer):
    """Serializer for completed tours in the following feed."""
    user = UserSerializer(read_only=True)
    tour = serializers.SerializerMethodField()
    completed_at = serializers.DateTimeField(read_only=True)

    def get_tour(self, obj):
        """Get basic tour information for the feed."""
        tour = obj.tour
        return {
            "id": tour.id,
            "title": tour.title,
            "description": tour.description,
            "category": tour.category,
            "difficulty": tour.difficulty,
            "duration_minutes": tour.duration_minutes,
            "city": tour.city,
            "cover_image": tour.cover_image.url if tour.cover_image else None,
            "created_at": tour.created_at,
        }
