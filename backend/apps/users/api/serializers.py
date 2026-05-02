from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from apps.users.models.Follow import Follow
from apps.users.models.SearchHistory import SearchHistory
from apps.users.models.User import User


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class LoginResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class UserSerializer(serializers.ModelSerializer):
    terms_accepted = serializers.BooleanField(write_only=True, required=False)
    terms_update_required = serializers.SerializerMethodField(read_only=True)

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
            "total_walked_km",
            "avatar_url",
            "terms_accepted",
            "terms_update_required",
        ]

    def get_terms_update_required(self, obj):
        return obj.terms_version != settings.CURRENT_TERMS_VERSION
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def validate_terms_accepted(self, value):
        if not value:
            raise serializers.ValidationError("You must accept the terms to register.")
        return value

    def create(self, validated_data):
        terms_accepted = validated_data.pop("terms_accepted", False)
        password = validated_data.pop("password", None)
        if terms_accepted:
            validated_data["terms_accepted_at"] = timezone.now()
            validated_data["terms_version"] = settings.CURRENT_TERMS_VERSION
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


class SearchHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchHistory
        fields = ["id", "search_type", "query", "searched_at"]
        read_only_fields = ["id", "searched_at"]

    def validate_search_type(self, value):
        valid_types = {choice[0] for choice in SearchHistory.SEARCH_TYPE_CHOICES}
        if value not in valid_types:
            raise serializers.ValidationError("Invalid search type.")
        return value

    def validate_query(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Query is required.")
        return value


class FollowingFeedSerializer(serializers.Serializer):
    """Serializer for completed tours in the following feed."""

    id = serializers.IntegerField(read_only=True)
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
            "country": tour.country,
            "country_code": tour.country_code,
            "generation_source": tour.generation_source,
            "cover_image": tour.cover_image.url if tour.cover_image else None,
            "cover_image_attribution": tour.cover_image_attribution,
            "created_at": tour.created_at,
        }
