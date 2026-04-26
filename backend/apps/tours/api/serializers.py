from rest_framework import serializers

from apps.tours.models import (
    ArPuzzleDetail,
    GyroscopePuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Review,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)
from apps.users.api.serializers import UserSerializer

DEFAULT_PICTURE_COMPARE_THRESHOLD = 0.7


class TriviaPuzzleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = TriviaPuzzleDetail
        fields = ["options", "correct_answer"]


class PictureComparePuzzleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = PictureComparePuzzleDetail
        fields = ["reference_image", "similarity_threshold"]


class ArPuzzleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArPuzzleDetail
        fields = ["scene_asset_url", "metadata"]


class GyroscopePuzzleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = GyroscopePuzzleDetail
        fields = ["target_pitch", "target_roll", "target_yaw", "tolerance_degrees"]


class PuzzleBaseUpsertSerializer(serializers.Serializer):
    question = serializers.CharField()
    hint = serializers.CharField(required=False, allow_blank=True, default="")
    xp_reward = serializers.IntegerField(required=False, min_value=0, default=10)


class TriviaPuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    options = serializers.ListField(child=serializers.CharField(), min_length=2)
    correct_answer = serializers.CharField()

    def validate(self, attrs):
        options = [option.strip() for option in attrs["options"] if option.strip()]
        if len(options) < 2:
            raise serializers.ValidationError(
                {"options": "TRIVIA puzzles require at least two non-empty options."}
            )

        if attrs["correct_answer"] not in options:
            raise serializers.ValidationError(
                {
                    "correct_answer": (
                        "correct_answer must match one of the provided options."
                    )
                }
            )

        attrs["options"] = options
        return attrs


class PictureComparePuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    reference_image = serializers.ImageField(required=False)
    similarity_threshold = serializers.FloatField(
        required=False,
        min_value=0.0,
        max_value=1.0,
    )

    def validate(self, attrs):
        step = self.context.get("step")
        if not step:
            return attrs

        existing_puzzle = getattr(step, "puzzle", None)
        if existing_puzzle is None:
            if not attrs.get("reference_image"):
                raise serializers.ValidationError(
                    {
                        "reference_image": (
                            "reference_image is required when creating "
                            "PICTURE_COMPARE puzzles."
                        )
                    }
                )
            return attrs

        has_image = attrs.get("reference_image")
        if not has_image:
            detail = getattr(existing_puzzle, "picture_compare_detail", None)
            has_image = bool(detail and detail.reference_image)

        if not has_image:
            raise serializers.ValidationError(
                {
                    "reference_image": (
                        "reference_image is required for PICTURE_COMPARE puzzles."
                    )
                }
            )

        return attrs


class ArPuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    scene_asset_url = serializers.URLField(required=False, allow_blank=True)
    metadata = serializers.JSONField(required=False)


class GyroscopePuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    target_pitch = serializers.FloatField(required=False, default=0.0)
    target_roll = serializers.FloatField(required=False, default=0.0)
    target_yaw = serializers.FloatField(required=False, default=0.0)
    tolerance_degrees = serializers.FloatField(required=False, default=15.0)


class PuzzleSerializer(serializers.ModelSerializer):
    trivia = serializers.SerializerMethodField()
    picture_compare = serializers.SerializerMethodField()
    ar = serializers.SerializerMethodField()
    gyroscope = serializers.SerializerMethodField()

    def get_trivia(self, obj):
        detail = getattr(obj, "trivia_detail", None)
        if detail is None or obj.puzzle_type != Puzzle.TRIVIA:
            return None
        return TriviaPuzzleDetailSerializer(detail, context=self.context).data

    def get_picture_compare(self, obj):
        detail = getattr(obj, "picture_compare_detail", None)
        if detail is None or obj.puzzle_type != Puzzle.PICTURE_COMPARE:
            return None
        return PictureComparePuzzleDetailSerializer(detail, context=self.context).data

    def get_ar(self, obj):
        detail = getattr(obj, "ar_detail", None)
        if detail is None:
            return None
        return ArPuzzleDetailSerializer(detail, context=self.context).data

    def get_gyroscope(self, obj):
        detail = getattr(obj, "gyroscope_detail", None)
        if detail is None:
            return None
        return GyroscopePuzzleDetailSerializer(detail, context=self.context).data

    class Meta:
        model = Puzzle
        fields = [
            "id",
            "puzzle_type",
            "question",
            "hint",
            "xp_reward",
            "trivia",
            "picture_compare",
            "ar",
            "gyroscope",
        ]


class TourStepSerializer(serializers.ModelSerializer):
    puzzle = PuzzleSerializer(read_only=True)

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


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "rating", "comment", "created_at"]
        read_only_fields = ["user", "created_at"]


class TourSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    steps = serializers.SerializerMethodField()
    step_count = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    has_access = serializers.SerializerMethodField()

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
            "credit_price",
            "city",
            "cover_image",
            "status",
            "created_at",
            "updated_at",
            "steps",
            "step_count",
            "reviews",
            "average_rating",
            "has_access",
        ]
        read_only_fields = [
            "creator",
            "created_at",
            "updated_at",
            "average_rating",
            "has_access",
            "step_count",
        ]

    def get_step_count(self, obj):
        return obj.steps.count()

    def get_steps(self, obj):
        if not self.get_has_access(obj):
            return []
        return TourStepSerializer(obj.steps.all().order_by("order"), many=True).data

    def validate(self, attrs):
        request = self.context.get("request")
        user = getattr(request, "user", None) if request else None
        from apps.users.models.User import User

        is_creator_role = bool(
            user and user.is_authenticated and user.user_type == User.CREATOR
        )
        if not is_creator_role:
            attrs["is_premium"] = False
            attrs["credit_price"] = 0
        return attrs

    def get_has_access(self, obj):
        if obj.credit_price == 0 and not obj.is_premium:
            return True

        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            purchased_tour_ids = self.context.get("purchased_tour_ids")
            if purchased_tour_ids is not None:
                return obj.id in purchased_tour_ids

            from apps.payments.services.credit_service import CreditService

            return CreditService.has_tour_access(request.user, obj)

        return False

    def create(self, validated_data):
        # Assign current user as creator
        validated_data["creator"] = self.context["request"].user
        return super().create(validated_data)
