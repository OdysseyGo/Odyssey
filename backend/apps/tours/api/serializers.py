import re

from rest_framework import serializers

from apps.gamification.models import TourProgress
from apps.tours.models import (
    ARModel,
    ArPuzzleDetail,
    CompassPuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Review,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)
from apps.tours.utils import GoogleMapsFacade, normalize_tour_country
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


class CompassPuzzleDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = CompassPuzzleDetail
        fields = ["target_heading_degrees"]


class PuzzleBaseUpsertSerializer(serializers.Serializer):
    question = serializers.CharField()
    hint = serializers.CharField(required=False, allow_blank=True, default="")


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


class CompassPuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    target_heading_degrees = serializers.IntegerField(min_value=0, max_value=359)


class OpenEndedPuzzleUpsertSerializer(PuzzleBaseUpsertSerializer):
    correct_answer = serializers.CharField()

    def validate(self, attrs):
        correct_answer = str(attrs.get("correct_answer", "")).strip()
        if not correct_answer:
            raise serializers.ValidationError(
                {
                    "correct_answer": "OPEN_ENDED puzzles require a non-empty correct_answer."
                }
            )
        attrs["correct_answer"] = correct_answer
        return attrs


class PuzzleSerializer(serializers.ModelSerializer):
    trivia = serializers.SerializerMethodField()
    open_ended = serializers.SerializerMethodField()
    picture_compare = serializers.SerializerMethodField()
    ar = serializers.SerializerMethodField()
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

    def get_open_ended(self, obj):
        if obj.puzzle_type != Puzzle.OPEN_ENDED:
            return None
        payload = {"answer_type": "text"}
        request = self.context.get("request")
        if request is None:
            return payload

        user = getattr(request, "user", None)
        is_creator_or_staff = bool(
            user
            and user.is_authenticated
            and (user.is_staff or obj.step.tour.creator_id == user.id)
        )
        if is_creator_or_staff:
            payload["correct_answer"] = obj.correct_answer
        return payload

    def get_ar(self, obj):
        detail = getattr(obj, "ar_detail", None)
        if detail is None:
            return None
        return ArPuzzleDetailSerializer(detail, context=self.context).data

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
            "open_ended",
            "picture_compare",
            "ar",
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
    user_has_completed_once = serializers.SerializerMethodField()
    city_latitude = serializers.FloatField(write_only=True, required=False)
    city_longitude = serializers.FloatField(write_only=True, required=False)

    def get_user_has_completed_once(self, obj):
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        return TourProgress.objects.filter(
            tour=obj,
            user=user,
            has_completed_once=True,
        ).exists()

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
            "cover_image_attribution",
            "is_ai_generated",
            "user_has_completed_once",
            "status",
            "review_status",
            "generation_source",
            "submission_type",
            "created_at",
            "updated_at",
            "steps",
            "reviews",
            "average_rating",
        ]
        read_only_fields = [
            "creator",
            "is_ai_generated",
            "user_has_completed_once",
            "created_at",
            "updated_at",
            "average_rating",
            "cover_image_attribution",
            "total_distance",
            "walking_distance",
            "elevation_gain",
            "max_leg_distance",
            "requires_transport",
            "is_circular",
            "accessibility_rating",
            "metrics_calculated",
            "generation_source",
            "review_status",
            "submission_type",
        ]

    def validate(self, attrs):
        instance = self.instance
        request = self.context.get("request")
        user = getattr(request, "user", None)
        current_status = getattr(instance, "status", Tour.PENDING)
        status_value = attrs.get("status", current_status)
        current_cover_image = getattr(instance, "cover_image", None)
        cover_image = attrs.get("cover_image", current_cover_image)
        has_cover = bool(cover_image)
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

        if (
            status_value == Tour.PUBLISHED
            and current_status != Tour.PUBLISHED
            and (not user or not user.is_staff)
        ):
            raise serializers.ValidationError(
                {"status": "Only admins can publish tours."}
            )

        if status_value == Tour.PUBLISHED and (is_publishing or is_location_update):
            if not has_cover:
                raise serializers.ValidationError(
                    {"cover_image": "Cover image is required before publishing a tour."}
                )
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

        if instance is None and not has_cover:
            raise serializers.ValidationError(
                {"cover_image": "Cover image is required when creating a tour."}
            )

        return attrs

    def create(self, validated_data):
        # Assign current user as creator
        validated_data.pop("city_latitude", None)
        validated_data.pop("city_longitude", None)
        self._canonicalize_country_fields(validated_data)
        validated_data["creator"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("city_latitude", None)
        validated_data.pop("city_longitude", None)
        self._canonicalize_country_fields(validated_data)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        has_creator_changes = any(
            key not in {"status", "review_status"} for key in validated_data
        )
        if (
            instance.status == Tour.PENDING
            and instance.review_status == Tour.REJECTED
            and user
            and not user.is_staff
            and has_creator_changes
        ):
            validated_data["review_status"] = Tour.IN_REVIEW
        return super().update(instance, validated_data)

    def _canonicalize_country_fields(self, validated_data):
        if self.instance is None:
            current_country = ""
            current_country_code = ""
        else:
            current_country = self.instance.country
            current_country_code = self.instance.country_code

        incoming_has_country = "country" in validated_data
        incoming_has_country_code = "country_code" in validated_data

        effective_country = validated_data.get("country", current_country)
        effective_country_code = validated_data.get(
            "country_code", current_country_code
        )

        # Normalize explicit incoming text fields even when no code is available.
        if incoming_has_country:
            validated_data["country"] = (validated_data.get("country") or "").strip()
        if incoming_has_country_code:
            validated_data["country_code"] = (
                (validated_data.get("country_code") or "").strip().upper()
            )

        if not effective_country_code:
            return

        # Keep backend storage language-agnostic by deriving canonical country from ISO code.
        canonical_country, canonical_country_code = normalize_tour_country(
            country=effective_country,
            country_code=effective_country_code,
        )
        validated_data["country"] = canonical_country
        validated_data["country_code"] = canonical_country_code
