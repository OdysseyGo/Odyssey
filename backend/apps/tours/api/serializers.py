import re

from rest_framework import serializers

from apps.tours.models import (
    ARModel,
    ArPuzzleDetail,
    CompassPuzzleDetail,
    GyroscopePuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Review,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)
from apps.tours.utils import GoogleMapsFacade
from apps.users.api.serializers import UserSerializer

DEFAULT_PICTURE_COMPARE_THRESHOLD = 0.7
SECRET_CODE_REGEX = re.compile(r"^[A-Za-z0-9]{4,12}$")
MIN_MODEL_SCALE_METERS = 0.3
MAX_MODEL_SCALE_METERS = 10.0
DEFAULT_MODEL_SCALE_METERS = 1.0


class ARModelSerializer(serializers.ModelSerializer):
    preview_image_url = serializers.SerializerMethodField()
    scene_asset_url = serializers.SerializerMethodField()

    def get_preview_image_url(self, obj):
        return obj.get_preview_image_url(request=self.context.get("request"))

    def get_scene_asset_url(self, obj):
        return obj.get_scene_asset_url(request=self.context.get("request"))

    class Meta:
        model = ARModel
        fields = [
            "id",
            "slug",
            "name",
            "preview_image_url",
            "scene_asset_url",
            "anchors",
        ]


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


class CompassPuzzleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompassPuzzleDetail
        fields = ["target_heading_degrees"]


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

    def validate(self, attrs):
        metadata = attrs.get("metadata") or {}
        if not isinstance(metadata, dict):
            raise serializers.ValidationError(
                {"metadata": "metadata must be a JSON object."}
            )

        model_id = metadata.get("model_id")
        anchor_id = metadata.get("anchor_id")
        secret_code = metadata.get("secret_code")
        placement_mode = metadata.get("placement_mode")
        model_scale_meters = metadata.get(
            "model_scale_meters", DEFAULT_MODEL_SCALE_METERS
        )

        if not model_id:
            raise serializers.ValidationError({"metadata": "model_id is required."})
        if not anchor_id:
            raise serializers.ValidationError({"metadata": "anchor_id is required."})
        if not secret_code:
            raise serializers.ValidationError({"metadata": "secret_code is required."})
        if placement_mode != "anchor":
            raise serializers.ValidationError(
                {"metadata": "placement_mode must be 'anchor'."}
            )
        if not SECRET_CODE_REGEX.match(str(secret_code)):
            raise serializers.ValidationError(
                {"metadata": "secret_code must be 4-12 alphanumeric characters."}
            )
        try:
            model_scale_meters = float(model_scale_meters)
        except (TypeError, ValueError):
            raise serializers.ValidationError(
                {"metadata": "model_scale_meters must be a valid number."}
            )
        if not (MIN_MODEL_SCALE_METERS <= model_scale_meters <= MAX_MODEL_SCALE_METERS):
            raise serializers.ValidationError(
                {
                    "metadata": (
                        f"model_scale_meters must be between "
                        f"{MIN_MODEL_SCALE_METERS} and {MAX_MODEL_SCALE_METERS}."
                    )
                }
            )

        ar_model = ARModel.objects.filter(id=model_id, is_active=True).first()
        if ar_model is None:
            raise serializers.ValidationError({"metadata": "model_id is invalid."})

        anchor = next(
            (
                item
                for item in ar_model.anchors
                if isinstance(item, dict) and str(item.get("id")) == str(anchor_id)
            ),
            None,
        )
        if anchor is None:
            raise serializers.ValidationError(
                {"metadata": "anchor_id is invalid for the selected model."}
            )

        position = anchor.get("position") if isinstance(anchor, dict) else {}
        if not isinstance(position, dict):
            position = {}

        attrs["scene_asset_url"] = ar_model.get_scene_asset_url(
            request=self.context.get("request")
        )
        attrs["metadata"] = {
            "version": 1,
            "model_id": ar_model.id,
            "anchor_id": str(anchor_id),
            "placement_mode": "anchor",
            "secret_code": str(secret_code),
            "model_scale_meters": model_scale_meters,
            "anchor_position": {
                "x": float(position.get("x", 0.0)),
                "y": float(position.get("y", 0.0)),
                "z": float(position.get("z", 0.0)),
            },
        }
        return attrs


class GyroscopePuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    target_pitch = serializers.FloatField(required=False, default=0.0)
    target_roll = serializers.FloatField(required=False, default=0.0)
    target_yaw = serializers.FloatField(required=False, default=0.0)
    tolerance_degrees = serializers.FloatField(required=False, default=15.0)


class CompassPuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    target_heading_degrees = serializers.IntegerField(min_value=0, max_value=359)


class PuzzleSerializer(serializers.ModelSerializer):
    trivia = serializers.SerializerMethodField()
    picture_compare = serializers.SerializerMethodField()
    ar = serializers.SerializerMethodField()
    gyroscope = serializers.SerializerMethodField()
    compass = serializers.SerializerMethodField()

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

    def get_compass(self, obj):
        detail = getattr(obj, "compass_detail", None)
        if detail is None:
            return None
        return CompassPuzzleDetailSerializer(detail, context=self.context).data

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
            "compass",
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
    steps = TourStepSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.FloatField(read_only=True)
    city_latitude = serializers.FloatField(write_only=True, required=False)
    city_longitude = serializers.FloatField(write_only=True, required=False)

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
            "walking_distance",
            "elevation_gain",
            "max_leg_distance",
            "requires_transport",
            "is_circular",
            "accessibility_rating",
            "metrics_calculated",
            "is_premium",
            "city",
            "country",
            "country_code",
            "city_latitude",
            "city_longitude",
            "cover_image",
            "status",
            "created_at",
            "updated_at",
            "steps",
            "reviews",
            "average_rating",
        ]
        read_only_fields = [
            "creator",
            "created_at",
            "updated_at",
            "average_rating",
            "total_distance",
            "walking_distance",
            "elevation_gain",
            "max_leg_distance",
            "requires_transport",
            "is_circular",
            "accessibility_rating",
            "metrics_calculated",
        ]

    def validate(self, attrs):
        instance = self.instance
        current_status = getattr(instance, "status", Tour.DRAFT)
        status_value = attrs.get("status", current_status)
        city = attrs.get("city", getattr(instance, "city", ""))
        city_latitude = attrs.get("city_latitude")
        city_longitude = attrs.get("city_longitude")
        is_publishing = (
            status_value == Tour.PUBLISHED and current_status != Tour.PUBLISHED
        )
        is_location_update = any(
            field in attrs
            for field in (
                "city",
                "country",
                "country_code",
            )
        )

        if status_value == Tour.PUBLISHED and (is_publishing or is_location_update):
            if not city:
                raise serializers.ValidationError(
                    {"city": "City is required before publishing a tour."}
                )
            if city_latitude is None or city_longitude is None:
                raise serializers.ValidationError(
                    {"city": "City coordinates are required before publishing a tour."}
                )

            if instance is None:
                raise serializers.ValidationError(
                    {"steps": "At least one tour stop is required before publishing."}
                )

            if not instance.steps.exists():
                raise serializers.ValidationError(
                    {"steps": "At least one tour stop is required before publishing."}
                )

            if not GoogleMapsFacade().tour_has_step_in_city(
                instance,
                city_latitude=float(city_latitude),
                city_longitude=float(city_longitude),
            ):
                raise serializers.ValidationError(
                    {
                        "city": (
                            "At least one tour stop must be inside the selected city."
                        )
                    }
                )

        return attrs

    def create(self, validated_data):
        # Assign current user as creator
        validated_data.pop("city_latitude", None)
        validated_data.pop("city_longitude", None)
        validated_data["creator"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("city_latitude", None)
        validated_data.pop("city_longitude", None)
        return super().update(instance, validated_data)
