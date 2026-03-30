from rest_framework import serializers

from apps.admin_dashboard.models import BanRecord, Report
from apps.tours.models import Puzzle, Review, Tour, TourStep
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
            "follow_count",
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
