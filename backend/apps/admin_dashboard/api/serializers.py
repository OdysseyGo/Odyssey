import json

from rest_framework import serializers

from apps.admin_dashboard.models import BanRecord, Report
from apps.gamification.models import PictureCompareConfig
from apps.tours.models import ARModel, Puzzle, Review, Tour, TourStep
from apps.users.models import User

# ── User Management ──────────────────────────────────────────────────


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "user_type",
            "is_staff",
            "is_banned",
            "xp",
            "level",
            "country",
            "date_joined",
        ]


class AdminUserDetailSerializer(serializers.ModelSerializer):
    badges_earned_count = serializers.IntegerField(read_only=True)
    tours_created_count = serializers.IntegerField(read_only=True)
    tours_completed_count = serializers.IntegerField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    ban_records = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "user_type",
            "is_staff",
            "is_banned",
            "xp",
            "level",
            "country",
            "following_count",
            "follower_count",
            "credit",
            "tour_count",
            "rating",
            "date_joined",
            "last_login",
            "badges_earned_count",
            "tours_created_count",
            "tours_completed_count",
            "reviews_count",
            "ban_records",
        ]

    def get_ban_records(self, obj):
        records = obj.ban_records.all()[:5]
        return BanRecordSerializer(records, many=True).data


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["user_type", "is_staff"]


class BulkUserActionSerializer(serializers.Serializer):
    BAN = "ban"
    UNBAN = "unban"
    CHANGE_ROLE = "change_role"

    ACTION_CHOICES = [
        (BAN, "Ban"),
        (UNBAN, "Unban"),
        (CHANGE_ROLE, "Change Role"),
    ]

    user_ids = serializers.ListField(child=serializers.IntegerField(), min_length=1)
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    role = serializers.IntegerField(required=False)
    reason = serializers.CharField(required=False, default="Bulk admin action")

    def validate(self, data):
        if data["action"] == self.CHANGE_ROLE and "role" not in data:
            raise serializers.ValidationError(
                {"role": "Role is required for change_role action."}
            )
        if data["action"] == self.CHANGE_ROLE:
            valid_roles = [c[0] for c in User.USER_TYPE_CHOICES]
            if data["role"] not in valid_roles:
                raise serializers.ValidationError(
                    {"role": f"Invalid role. Must be one of {valid_roles}."}
                )
        return data


class BanUserSerializer(serializers.Serializer):
    reason = serializers.CharField()
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class PictureCompareTuningSerializer(serializers.Serializer):
    reference_image = serializers.ImageField()
    attempt_image = serializers.ImageField()
    threshold = serializers.FloatField(min_value=0.0, max_value=1.0, default=0.7)
    fast_reject_threshold = serializers.FloatField(
        min_value=0.0, max_value=1.0, required=False
    )
    histogram_penalty_threshold = serializers.FloatField(
        min_value=0.0, max_value=1.0, required=False
    )
    grid_penalty_threshold = serializers.FloatField(
        min_value=0.0, max_value=1.0, required=False
    )
    histogram_penalty_multiplier = serializers.FloatField(
        min_value=0.0, max_value=1.0, required=False
    )
    grid_penalty_multiplier = serializers.FloatField(
        min_value=0.0, max_value=1.0, required=False
    )
    base_weight = serializers.FloatField(min_value=0.0, max_value=1.0, required=False)
    edge_weight = serializers.FloatField(min_value=0.0, max_value=1.0, required=False)
    histogram_weight = serializers.FloatField(
        min_value=0.0, max_value=1.0, required=False
    )
    grid_weight = serializers.FloatField(min_value=0.0, max_value=1.0, required=False)
    fast_max_shift = serializers.IntegerField(min_value=1, max_value=32, required=False)
    fast_step = serializers.IntegerField(min_value=1, max_value=8, required=False)
    final_max_shift = serializers.IntegerField(
        min_value=1, max_value=48, required=False
    )
    final_step = serializers.IntegerField(min_value=1, max_value=8, required=False)
    edge_max_shift = serializers.IntegerField(min_value=1, max_value=48, required=False)
    edge_step = serializers.IntegerField(min_value=1, max_value=8, required=False)

    def tuning_config(self):
        image_fields = {"reference_image", "attempt_image", "threshold"}
        return {
            key: value
            for key, value in self.validated_data.items()
            if key not in image_fields
        }


class PictureCompareConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = PictureCompareConfig
        fields = [
            "similarity_threshold",
            "fast_reject_threshold",
            "base_weight",
            "edge_weight",
            "histogram_weight",
            "grid_weight",
            "histogram_penalty_threshold",
            "grid_penalty_threshold",
            "histogram_penalty_multiplier",
            "grid_penalty_multiplier",
            "fast_max_shift",
            "fast_step",
            "final_max_shift",
            "final_step",
            "edge_max_shift",
            "edge_step",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate(self, attrs):
        ratio_fields = [
            "similarity_threshold",
            "fast_reject_threshold",
            "base_weight",
            "edge_weight",
            "histogram_weight",
            "grid_weight",
            "histogram_penalty_threshold",
            "grid_penalty_threshold",
            "histogram_penalty_multiplier",
            "grid_penalty_multiplier",
        ]
        for field in ratio_fields:
            if field in attrs and not 0.0 <= attrs[field] <= 1.0:
                raise serializers.ValidationError({field: "Must be between 0 and 1."})

        int_bounds = {
            "fast_max_shift": (1, 32),
            "fast_step": (1, 8),
            "final_max_shift": (1, 48),
            "final_step": (1, 8),
            "edge_max_shift": (1, 48),
            "edge_step": (1, 8),
        }
        for field, (minimum, maximum) in int_bounds.items():
            if field in attrs and not minimum <= attrs[field] <= maximum:
                raise serializers.ValidationError(
                    {field: f"Must be between {minimum} and {maximum}."}
                )

        return attrs


class AdminARModelSerializer(serializers.ModelSerializer):
    preview_image_url = serializers.SerializerMethodField()
    scene_asset_url = serializers.SerializerMethodField()
    anchor_count = serializers.SerializerMethodField()
    preview_image = serializers.ImageField(required=False, allow_null=True)
    scene_asset_file = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = ARModel
        fields = [
            "id",
            "slug",
            "name",
            "preview_image",
            "preview_image_url",
            "scene_asset_file",
            "scene_asset_url",
            "anchors",
            "anchor_count",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "preview_image_url",
            "scene_asset_url",
            "anchor_count",
            "created_at",
            "updated_at",
        ]

    def get_preview_image_url(self, obj):
        return obj.get_preview_image_url(request=self.context.get("request"))

    def get_scene_asset_url(self, obj):
        return obj.get_scene_asset_url(request=self.context.get("request"))

    def get_anchor_count(self, obj):
        return len(obj.anchors or [])

    def validate_scene_asset_file(self, value):
        filename = (value.name or "").lower()
        if not filename.endswith(".glb"):
            raise serializers.ValidationError("scene_asset_file must be a .glb file.")
        return value

    def validate_anchors(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError("anchors must be valid JSON.") from exc

        if not isinstance(value, list):
            raise serializers.ValidationError("anchors must be a JSON array.")

        seen_ids = set()
        normalized = []
        for index, anchor in enumerate(value):
            if not isinstance(anchor, dict):
                raise serializers.ValidationError(
                    {"anchors": f"Anchor at index {index} must be an object."}
                )

            anchor_id = str(anchor.get("id", "")).strip()
            label = str(anchor.get("label", "")).strip()
            position = anchor.get("position")
            normal = anchor.get("normal")
            order = anchor.get("order", index)

            if not anchor_id:
                raise serializers.ValidationError(
                    {"anchors": f"Anchor at index {index} is missing id."}
                )
            if anchor_id in seen_ids:
                raise serializers.ValidationError(
                    {"anchors": f"Duplicate anchor id '{anchor_id}'."}
                )
            if not label:
                raise serializers.ValidationError(
                    {"anchors": f"Anchor '{anchor_id}' is missing label."}
                )
            if not isinstance(position, dict):
                raise serializers.ValidationError(
                    {"anchors": f"Anchor '{anchor_id}' is missing position."}
                )

            def parse_vector(raw_value, field_name):
                if raw_value is None:
                    return None
                if not isinstance(raw_value, dict):
                    raise serializers.ValidationError(
                        {
                            "anchors": (
                                f"Anchor '{anchor_id}' {field_name} must be an object."
                            )
                        }
                    )
                parsed = {}
                for axis in ("x", "y", "z"):
                    if axis not in raw_value:
                        raise serializers.ValidationError(
                            {
                                "anchors": (
                                    f"Anchor '{anchor_id}' {field_name} requires "
                                    f"{axis}."
                                )
                            }
                        )
                    try:
                        parsed[axis] = float(raw_value[axis])
                    except (TypeError, ValueError) as exc:
                        raise serializers.ValidationError(
                            {
                                "anchors": (
                                    f"Anchor '{anchor_id}' {field_name}.{axis} "
                                    "must be numeric."
                                )
                            }
                        ) from exc
                return parsed

            try:
                parsed_order = int(order)
            except (TypeError, ValueError) as exc:
                raise serializers.ValidationError(
                    {"anchors": f"Anchor '{anchor_id}' order must be an integer."}
                ) from exc

            seen_ids.add(anchor_id)
            normalized.append(
                {
                    "id": anchor_id,
                    "label": label,
                    "position": parse_vector(position, "position"),
                    "normal": parse_vector(normal, "normal") if normal else None,
                    "order": parsed_order,
                }
            )

        return normalized

    def validate(self, attrs):
        instance = getattr(self, "instance", None)
        anchors = attrs.get("anchors")
        preview_image = attrs.get("preview_image")
        scene_asset_file = attrs.get("scene_asset_file")

        errors = {}
        if instance is None:
            if not scene_asset_file:
                errors["scene_asset_file"] = "scene_asset_file is required."
            if not preview_image:
                errors["preview_image"] = "preview_image is required."
            if not anchors:
                errors["anchors"] = "At least one anchor is required."

        if errors:
            raise serializers.ValidationError(errors)

        return attrs


# ── Tour Management ──────────────────────────────────────────────────


class AdminTourStepSerializer(serializers.ModelSerializer):
    has_puzzle = serializers.SerializerMethodField()

    class Meta:
        model = TourStep
        fields = ["id", "order", "title", "latitude", "longitude", "has_puzzle"]

    def get_has_puzzle(self, obj):
        return hasattr(obj, "puzzle")


class AdminTourListSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source="creator.username", read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    completion_count = serializers.IntegerField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)
    step_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tour
        fields = [
            "id",
            "title",
            "creator",
            "creator_username",
            "tour_type",
            "difficulty",
            "status",
            "city",
            "duration_minutes",
            "is_premium",
            "created_at",
            "avg_rating",
            "completion_count",
            "review_count",
            "step_count",
        ]


class AdminPuzzleSerializer(serializers.ModelSerializer):
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
            "reference_image",
        ]


class AdminTourStepDetailSerializer(serializers.ModelSerializer):
    puzzle = AdminPuzzleSerializer(read_only=True)

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


class AdminReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "user", "username", "rating", "comment", "created_at"]


class AdminTourDetailSerializer(serializers.ModelSerializer):
    creator_username = serializers.CharField(source="creator.username", read_only=True)
    steps = AdminTourStepDetailSerializer(many=True, read_only=True)
    reviews = AdminReviewSerializer(many=True, read_only=True)
    avg_rating = serializers.FloatField(read_only=True)
    completion_count = serializers.IntegerField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Tour
        fields = [
            "id",
            "title",
            "description",
            "creator",
            "creator_username",
            "tour_type",
            "category",
            "difficulty",
            "duration_minutes",
            "is_premium",
            "city",
            "total_distance",
            "walking_distance",
            "transport_distance",
            "elevation_gain",
            "max_leg_distance",
            "requires_transport",
            "is_circular",
            "accessibility_rating",
            "status",
            "created_at",
            "updated_at",
            "steps",
            "reviews",
            "avg_rating",
            "completion_count",
            "review_count",
        ]


# ── Content Moderation ───────────────────────────────────────────────


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(
        source="reporter.username", read_only=True
    )
    resolved_by_username = serializers.CharField(
        source="resolved_by.username", read_only=True, default=None
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter",
            "reporter_username",
            "content_type",
            "content_id",
            "reason",
            "status",
            "admin_notes",
            "created_at",
            "resolved_at",
            "resolved_by",
            "resolved_by_username",
        ]


class ReportCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["content_type", "content_id", "reason"]

    def validate(self, data):
        content_type = data["content_type"]
        content_id = data["content_id"]

        model_map = {
            Report.TOUR: Tour,
            Report.REVIEW: Review,
            Report.USER: User,
        }
        model = model_map[content_type]
        if not model.objects.filter(id=content_id).exists():
            raise serializers.ValidationError(
                f"{content_type} with id {content_id} does not exist."
            )
        return data


class ReportActionSerializer(serializers.Serializer):
    WARN = "warn"
    REMOVE_CONTENT = "remove_content"
    BAN_USER = "ban_user"
    DISMISS = "dismiss"

    ACTION_CHOICES = [
        (WARN, "Warn"),
        (REMOVE_CONTENT, "Remove Content"),
        (BAN_USER, "Ban User"),
        (DISMISS, "Dismiss"),
    ]

    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    admin_notes = serializers.CharField(required=False, default="")
    ban_reason = serializers.CharField(required=False, default="Violation of terms")


class BanRecordSerializer(serializers.ModelSerializer):
    banned_by_username = serializers.CharField(
        source="banned_by.username", read_only=True, default=None
    )
    unbanned_by_username = serializers.CharField(
        source="unbanned_by.username", read_only=True, default=None
    )

    class Meta:
        model = BanRecord
        fields = [
            "id",
            "user",
            "banned_by",
            "banned_by_username",
            "reason",
            "is_active",
            "banned_at",
            "expires_at",
            "unbanned_at",
            "unbanned_by",
            "unbanned_by_username",
        ]


# ── Analytics ────────────────────────────────────────────────────────


class DashboardSummarySerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_tours = serializers.IntegerField()
    total_reviews = serializers.IntegerField()
    new_users_7d = serializers.IntegerField()
    new_users_30d = serializers.IntegerField()
    new_tours_7d = serializers.IntegerField()
    new_tours_30d = serializers.IntegerField()
    active_users_7d = serializers.IntegerField()
    pending_reports = serializers.IntegerField()


class TimeSeriesPointSerializer(serializers.Serializer):
    date = serializers.DateTimeField()
    count = serializers.IntegerField()


class DistributionItemSerializer(serializers.Serializer):
    label = serializers.CharField()
    count = serializers.IntegerField()


class TopTourSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    title = serializers.CharField()
    creator_username = serializers.CharField()
    value = serializers.FloatField()
