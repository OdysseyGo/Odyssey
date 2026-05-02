import json

from rest_framework import serializers

from apps.admin_dashboard.models import BanRecord, Report
from apps.gamification.models import (
    Badge,
    PictureCompareConfig,
    UserBadge,
    UserBadgeHistory,
)
from apps.gamification.visuals import DEFAULT_BADGE_VISUAL_CONFIG
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


class AdminBadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ["id", "code", "name", "description", "icon", "criteria"]


class AdminUserBadgeSerializer(serializers.ModelSerializer):
    badge = AdminBadgeSerializer(read_only=True)
    source_tour_detail = serializers.SerializerMethodField()

    class Meta:
        model = UserBadge
        fields = [
            "id",
            "badge",
            "city",
            "country_code",
            "mistake_count",
            "source_tour",
            "source_tour_detail",
            "earned_at",
        ]

    def get_source_tour_detail(self, obj):
        tour = obj.source_tour
        if tour is None:
            return None
        return {
            "id": tour.id,
            "title": tour.title,
            "city": tour.city,
            "country": tour.country,
            "country_code": tour.country_code,
        }


class AdminUserBadgeHistorySerializer(serializers.ModelSerializer):
    badge = AdminBadgeSerializer(read_only=True)
    source_tour_detail = serializers.SerializerMethodField()

    class Meta:
        model = UserBadgeHistory
        fields = [
            "id",
            "badge",
            "user_badge",
            "city",
            "country_code",
            "mistake_count",
            "event_type",
            "source_tour",
            "source_tour_detail",
            "earned_at",
        ]

    def get_source_tour_detail(self, obj):
        tour = obj.source_tour
        if tour is None:
            return None
        return {
            "id": tour.id,
            "title": tour.title,
            "city": tour.city,
            "country": tour.country,
            "country_code": tour.country_code,
        }


class AdminUserDetailSerializer(serializers.ModelSerializer):
    badges_earned_count = serializers.IntegerField(read_only=True)
    tours_created_count = serializers.IntegerField(read_only=True)
    tours_completed_count = serializers.IntegerField(read_only=True)
    reviews_count = serializers.IntegerField(read_only=True)
    ban_records = serializers.SerializerMethodField()
    badges = serializers.SerializerMethodField()
    badge_history = serializers.SerializerMethodField()

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
            "badges",
            "badge_history",
        ]

    def get_ban_records(self, obj):
        records = obj.ban_records.all()[:5]
        return BanRecordSerializer(records, many=True).data

    def get_badges(self, obj):
        badges = obj.badges.select_related("badge", "source_tour").order_by(
            "-earned_at"
        )
        return AdminUserBadgeSerializer(badges, many=True).data

    def get_badge_history(self, obj):
        history = obj.badge_history.select_related("badge", "source_tour").order_by(
            "-earned_at"
        )[:20]
        return AdminUserBadgeHistorySerializer(history, many=True).data


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


class BadgeVisualTemplateSerializer(serializers.Serializer):
    config = serializers.JSONField(required=True)

    def validate_config(self, value):
        return _validate_badge_visual_config(value, partial=True)


class BadgeVisualOverrideSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    badge = serializers.IntegerField(required=False, allow_null=True)
    badge_code = serializers.CharField(required=False, allow_blank=True)
    country_code = serializers.CharField(required=False, allow_blank=True, default="")
    config = serializers.JSONField(required=True)
    updated_at = serializers.CharField(required=False, allow_blank=True)

    def validate_country_code(self, value):
        normalized = (value or "").strip().upper()
        if normalized and (len(normalized) != 2 or not normalized.isalpha()):
            raise serializers.ValidationError(
                "country_code must be a 2-letter ISO code."
            )
        return normalized

    def validate_badge(self, value):
        if value and not Badge.objects.filter(id=value).exists():
            raise serializers.ValidationError("badge does not exist.")
        return value

    def validate_config(self, value):
        return _validate_badge_visual_config(value, partial=True)


class BadgeVisualBundleSerializer(serializers.Serializer):
    template = serializers.JSONField()
    overrides = BadgeVisualOverrideSerializer(many=True)
    badges = serializers.SerializerMethodField()

    def get_badges(self, _obj):
        badge_codes = self.context.get("badge_codes")
        badges = Badge.objects.order_by("id")
        if badge_codes is not None:
            badges = badges.filter(code__in=badge_codes)
        return [
            {
                "id": badge.id,
                "code": badge.code,
                "name": badge.name,
                "criteria": badge.criteria or {},
                "icon": badge.icon.url if badge.icon else "",
            }
            for badge in badges
        ]


class GameBadgeVisualTypeSerializer(serializers.Serializer):
    type_key = serializers.CharField()
    layout = serializers.JSONField(required=True)
    tiers = serializers.JSONField(required=True)

    def validate_type_key(self, value):
        normalized = (value or "").strip().upper()
        if not normalized:
            raise serializers.ValidationError("type_key is required.")
        return normalized

    def validate_layout(self, value):
        return _validate_game_badge_layout_config(value)

    def validate_tiers(self, value):
        return _validate_game_badge_tiers(value)


class GameBadgeVisualBundleSerializer(serializers.Serializer):
    items = serializers.JSONField()
    badges = serializers.JSONField()


def _validate_badge_visual_config(config, *, partial=False):
    if not isinstance(config, dict):
        raise serializers.ValidationError("config must be an object.")

    allowed_top = set(DEFAULT_BADGE_VISUAL_CONFIG.keys())
    invalid_keys = set(config.keys()) - allowed_top
    if invalid_keys:
        raise serializers.ValidationError(
            f"Unsupported top-level keys: {sorted(invalid_keys)}"
        )

    def _validate_number(path, value, minimum=None, maximum=None):
        if not isinstance(value, (int, float)):
            raise serializers.ValidationError({path: "must be numeric"})
        if minimum is not None and value < minimum:
            raise serializers.ValidationError({path: f"must be >= {minimum}"})
        if maximum is not None and value > maximum:
            raise serializers.ValidationError({path: f"must be <= {maximum}"})

    if "flag" in config and isinstance(config["flag"], dict):
        for key in ("x", "y", "width", "height"):
            if key in config["flag"]:
                lower = -2 if key in ("x", "y") else 0.01
                _validate_number(f"flag.{key}", config["flag"][key], lower, 3)
        if "rotation_deg" in config["flag"]:
            _validate_number(
                "flag.rotation_deg", config["flag"]["rotation_deg"], -180, 180
            )

    if "image" in config and isinstance(config["image"], dict):
        if "source" in config["image"]:
            source = config["image"]["source"]
            if source not in {"flag", "png"}:
                raise serializers.ValidationError(
                    {"image.source": "must be either 'flag' or 'png'"}
                )
        if "asset_url" in config["image"]:
            asset_url = config["image"]["asset_url"]
            if not isinstance(asset_url, str):
                raise serializers.ValidationError(
                    {"image.asset_url": "must be a string"}
                )

    if "text" in config and isinstance(config["text"], dict):
        if "x" in config["text"]:
            _validate_number("text.x", config["text"]["x"], -2, 3)
        if "y" in config["text"]:
            _validate_number("text.y", config["text"]["y"], -2, 3)
        if "rotation_deg" in config["text"]:
            _validate_number(
                "text.rotation_deg", config["text"]["rotation_deg"], -180, 180
            )
        if "font_scale" in config["text"]:
            _validate_number("text.font_scale", config["text"]["font_scale"], 0.2, 4)
        for key in ("scale_x", "scale_y"):
            if key in config["text"]:
                _validate_number(f"text.{key}", config["text"][key], 0.2, 4)
        if "max_chars" in config["text"]:
            _validate_number("text.max_chars", config["text"]["max_chars"], 1, 80)

    if "text_plate" in config and isinstance(config["text_plate"], dict):
        for key in ("x", "y"):
            if key in config["text_plate"]:
                _validate_number(f"text_plate.{key}", config["text_plate"][key], -2, 3)
        for key in ("width", "height"):
            if key in config["text_plate"]:
                _validate_number(
                    f"text_plate.{key}", config["text_plate"][key], 0.01, 3
                )
        if "rotation_deg" in config["text_plate"]:
            _validate_number(
                "text_plate.rotation_deg",
                config["text_plate"]["rotation_deg"],
                -180,
                180,
            )
        for key in ("shape_tl", "shape_tr", "shape_br", "shape_bl"):
            if key in config["text_plate"]:
                _validate_number(
                    f"text_plate.{key}", config["text_plate"][key], -0.5, 1.5
                )

    if "palette" in config and isinstance(config["palette"], dict):
        allowed_tiers = set(DEFAULT_BADGE_VISUAL_CONFIG["palette"].keys())
        unknown_tiers = set(config["palette"].keys()) - allowed_tiers
        if unknown_tiers:
            raise serializers.ValidationError(
                {"palette": f"Unsupported tiers: {sorted(unknown_tiers)}"}
            )
        for tier, tier_palette in config["palette"].items():
            if not isinstance(tier_palette, dict):
                raise serializers.ValidationError(
                    {"palette": f"{tier} must be an object."}
                )
            allowed_colors = {
                "outer_fill",
                "inner_fill",
                "border",
                "text",
                "border_color",
                "inner_border_color",
                "frame_fill_top",
                "frame_fill_bottom",
                "fill_top",
                "fill_bottom",
                "frame_fill_opacity",
                "fill_opacity",
                "text_plate_fill",
                "text_plate_fill_opacity",
                "text_plate_stroke",
                "text_plate_stroke_opacity",
                "text_plate_stroke_width",
            }
            unknown_colors = set(tier_palette.keys()) - allowed_colors
            if unknown_colors:
                raise serializers.ValidationError(
                    {
                        "palette": f"{tier} has unsupported keys: {sorted(unknown_colors)}"
                    }
                )
            for color_key, color_value in tier_palette.items():
                if color_key in {
                    "frame_fill_opacity",
                    "fill_opacity",
                    "text_plate_fill_opacity",
                    "text_plate_stroke_opacity",
                }:
                    _validate_number(
                        f"palette.{tier}.{color_key}",
                        color_value,
                        0,
                        1,
                    )
                    continue
                if color_key in {"text_plate_stroke_width"}:
                    _validate_number(
                        f"palette.{tier}.{color_key}",
                        color_value,
                        0,
                        8,
                    )
                    continue
                if not isinstance(color_value, str):
                    raise serializers.ValidationError(
                        {"palette": f"{tier}.{color_key} must be a string."}
                    )

    if "hex" in config and isinstance(config["hex"], dict):
        if "stroke_width" in config["hex"]:
            _validate_number("hex.stroke_width", config["hex"]["stroke_width"], 0.1, 10)
        if "inner_stroke_width" in config["hex"]:
            _validate_number(
                "hex.inner_stroke_width",
                config["hex"]["inner_stroke_width"],
                0.1,
                10,
            )

    return config


def _validate_game_badge_layout_config(config):
    if not isinstance(config, dict):
        raise serializers.ValidationError("layout must be an object.")
    allowed_top = {"hex", "flag", "image", "text", "text_plate"}
    invalid_keys = set(config.keys()) - allowed_top
    if invalid_keys:
        raise serializers.ValidationError(
            f"Unsupported layout keys: {sorted(invalid_keys)}"
        )
    _validate_badge_visual_config(config, partial=True)
    return config


def _validate_game_badge_tiers(tiers):
    if not isinstance(tiers, dict):
        raise serializers.ValidationError("tiers must be an object.")
    allowed_keys = {"tier1", "tier2", "tier3", "tier4", "tier5"}
    invalid_keys = set(tiers.keys()) - allowed_keys
    if invalid_keys:
        raise serializers.ValidationError(
            f"Unsupported tier keys: {sorted(invalid_keys)}"
        )
    allowed_colors = {
        "outer_fill",
        "inner_fill",
        "border",
        "text",
        "border_color",
        "inner_border_color",
        "frame_fill_top",
        "frame_fill_bottom",
        "fill_top",
        "fill_bottom",
        "frame_fill_opacity",
        "fill_opacity",
        "text_plate_fill",
        "text_plate_fill_opacity",
        "text_plate_stroke",
        "text_plate_stroke_opacity",
        "text_plate_stroke_width",
    }
    for tier, palette in tiers.items():
        if not isinstance(palette, dict):
            raise serializers.ValidationError({tier: "must be an object."})
        unknown = set(palette.keys()) - allowed_colors
        if unknown:
            raise serializers.ValidationError(
                {tier: f"Unsupported keys: {sorted(unknown)}"}
            )
    return tiers


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
                raise serializers.ValidationError(
                    "anchors must be valid JSON."
                ) from exc

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


# ── Puzzle Detail Serializers  ---------------──────────────────────


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
            "review_status",
            "generation_source",
            "city",
            "country",
            "country_code",
            "duration_minutes",
            "is_premium",
            "created_at",
            "avg_rating",
            "completion_count",
            "review_count",
            "step_count",
        ]


class AdminPuzzleSerializer(serializers.ModelSerializer):
    trivia_detail = TriviaPuzzleDetailSerializer(read_only=True)
    picture_compare_detail = PictureComparePuzzleDetailSerializer(read_only=True)
    ar_detail = ArPuzzleDetailSerializer(read_only=True)
    compass_detail = CompassPuzzleDetailSerializer(read_only=True)

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
            "trivia_detail",
            "picture_compare_detail",
            "ar_detail",
            "compass_detail",
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
            "country",
            "country_code",
            "cover_image",
            "total_distance",
            "walking_distance",
            "transport_distance",
            "elevation_gain",
            "max_leg_distance",
            "requires_transport",
            "is_circular",
            "metrics_calculated",
            "accessibility_rating",
            "status",
            "review_status",
            "generation_source",
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
            "category",
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
        fields = ["content_type", "content_id", "category", "reason"]
        extra_kwargs = {
            "reason": {"required": False, "allow_blank": True},
        }

    def validate(self, data):
        content_type = data["content_type"]
        content_id = data["content_id"]
        category = data.get("category", Report.OTHER)
        reason = data.get("reason", "")

        if category == Report.OTHER and not reason.strip():
            raise serializers.ValidationError(
                {"reason": "Please describe the issue when selecting Other."}
            )

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
    ban_expires_at = serializers.DateTimeField(required=False, allow_null=True)


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
