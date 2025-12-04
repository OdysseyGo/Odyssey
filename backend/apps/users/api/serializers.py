from rest_framework import serializers

from apps.users.models.Admin import Admin
from apps.users.models.Follow import Follow
from apps.users.models.User import User

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
            "follow_count",
            "follower_count",
            "token",
            "level",
            "country",
            "user_type",
            "tour_count",
            "rating",
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class FollowSerializer(serializers.ModelSerializer):
    class Meta:
        model = Follow
        fields = ["follow_id", "follower", "followee"]
        read_only_fields = ["follower"]

    def validate(self, attrs):
        follower = self.context['request'].user
        followee = attrs.get("followee")
        if follower == followee:
            raise serializers.ValidationError(
                "A user cannot self follow."
            )
        if Follow.objects.filter(follower=follower, followee=followee).exists():
            raise serializers.ValidationError(
                "Already following this user."
            )
        return attrs

class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = [
            "admin_id",
            "name",
            "hashed_password",
        ]
        extra_kwargs = {
            "hashed_password": {"write_only": True},
        }
