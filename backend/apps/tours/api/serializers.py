from rest_framework import serializers

from apps.tours.models import Puzzle, Review, Tour, TourStep
from apps.users.api.serializers import UserSerializer


class PuzzleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Puzzle
        fields = [
            "id",
            "puzzle_type",
            "question",
            "options",
            "correct_answer",
            "hint",
            "xp_reward",
        ]


class TourStepSerializer(serializers.ModelSerializer):
    puzzle = PuzzleSerializer(required=False)

    class Meta:
        model = TourStep
        fields = [
            "id",
            "order",
            "title",
            "description",
            "latitude",
            "longitude",
            "image",
            "audio",
            "puzzle",
        ]

    def create(self, validated_data):
        puzzle_data = validated_data.pop("puzzle", None)
        step = TourStep.objects.create(**validated_data)
        if puzzle_data:
            Puzzle.objects.create(step=step, **puzzle_data)
        return step

    def update(self, instance, validated_data):
        puzzle_data = validated_data.pop("puzzle", None)

        # Update step fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update or create puzzle
        if puzzle_data:
            if hasattr(instance, "puzzle"):
                for attr, value in puzzle_data.items():
                    setattr(instance.puzzle, attr, value)
                instance.puzzle.save()
            else:
                Puzzle.objects.create(step=instance, **puzzle_data)

        return instance


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "rating", "comment", "created_at"]
        read_only_fields = ["user", "created_at"]


class TourSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    steps = TourStepSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)

    class Meta:
        model = Tour
        fields = [
            "id",
            "title",
            "description",
            "creator",
            "tour_type",
            "category",
            "difficulty",
            "duration_minutes",
            "total_distance",
            "is_premium",
            "city",
            "status",
            "created_at",
            "updated_at",
            "steps",
            "reviews",
            "average_rating",
        ]
        read_only_fields = ["creator", "created_at", "updated_at", "average_rating"]

    def create(self, validated_data):
        # Assign current user as creator
        validated_data["creator"] = self.context["request"].user
        return super().create(validated_data)
