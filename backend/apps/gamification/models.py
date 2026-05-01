from django.conf import settings
from django.db import models

from apps.gamification.picture_compare import DEFAULT_COMPARE_CONFIG


class Badge(models.Model):
    code = models.CharField(max_length=64, unique=True, blank=True, null=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.ImageField(upload_to="badges/", blank=True, null=True)
    criteria = models.JSONField(help_text="Rules for awarding this badge")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class UserBadge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="badges"
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    city = models.CharField(max_length=100, blank=True, default="")
    country_code = models.CharField(max_length=2, blank=True, default="ZZ")
    mistake_count = models.PositiveIntegerField(null=True, blank=True)
    source_tour = models.ForeignKey(
        "tours.Tour",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="awarded_badges",
    )
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "badge", "city", "country_code"],
                name="uniq_user_badge_city_country",
            )
        ]

    def __str__(self):
        return f"{self.user} earned {self.badge}"


class UserBadgeHistory(models.Model):
    EARNED = "EARNED"
    UPGRADED = "UPGRADED"

    EVENT_TYPE_CHOICES = [
        (EARNED, "Earned"),
        (UPGRADED, "Upgraded"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="badge_history",
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    user_badge = models.ForeignKey(
        UserBadge,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history",
    )
    source_tour = models.ForeignKey(
        "tours.Tour",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badge_award_history",
    )
    city = models.CharField(max_length=100, blank=True, default="")
    country_code = models.CharField(max_length=2, blank=True, default="ZZ")
    mistake_count = models.PositiveIntegerField(null=True, blank=True)
    event_type = models.CharField(
        max_length=20, choices=EVENT_TYPE_CHOICES, default=EARNED
    )
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-earned_at"]

    def __str__(self):
        return f"{self.user} {self.event_type.lower()} {self.badge}"


class TourProgress(models.Model):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"

    STATUS_CHOICES = [
        (IN_PROGRESS, "In Progress"),
        (COMPLETED, "Completed"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tour_progress"
    )
    tour = models.ForeignKey(
        "tours.Tour", on_delete=models.CASCADE, related_name="progress"
    )
    current_step = models.ForeignKey(
        "tours.TourStep", on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=IN_PROGRESS
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    has_completed_once = models.BooleanField(default=False)
    total_xp = models.IntegerField(default=0)
    skip_count = models.IntegerField(default=0)
    xp_awarded = models.BooleanField(default=False)
    wrong_attempt_count = models.IntegerField(default=0)

    class Meta:
        unique_together = ("user", "tour")

    def __str__(self):
        return f"{self.user} - {self.tour} ({self.status})"


class PictureCompareConfig(models.Model):
    singleton_id = models.PositiveSmallIntegerField(
        default=1, unique=True, editable=False
    )
    similarity_threshold = models.FloatField(default=0.7)
    fast_reject_threshold = models.FloatField(
        default=DEFAULT_COMPARE_CONFIG["fast_reject_threshold"]
    )
    base_weight = models.FloatField(default=DEFAULT_COMPARE_CONFIG["base_weight"])
    edge_weight = models.FloatField(default=DEFAULT_COMPARE_CONFIG["edge_weight"])
    histogram_weight = models.FloatField(
        default=DEFAULT_COMPARE_CONFIG["histogram_weight"]
    )
    grid_weight = models.FloatField(default=DEFAULT_COMPARE_CONFIG["grid_weight"])
    histogram_penalty_threshold = models.FloatField(
        default=DEFAULT_COMPARE_CONFIG["histogram_penalty_threshold"]
    )
    grid_penalty_threshold = models.FloatField(
        default=DEFAULT_COMPARE_CONFIG["grid_penalty_threshold"]
    )
    histogram_penalty_multiplier = models.FloatField(
        default=DEFAULT_COMPARE_CONFIG["histogram_penalty_multiplier"]
    )
    grid_penalty_multiplier = models.FloatField(
        default=DEFAULT_COMPARE_CONFIG["grid_penalty_multiplier"]
    )
    fast_max_shift = models.PositiveSmallIntegerField(
        default=DEFAULT_COMPARE_CONFIG["fast_max_shift"]
    )
    fast_step = models.PositiveSmallIntegerField(
        default=DEFAULT_COMPARE_CONFIG["fast_step"]
    )
    final_max_shift = models.PositiveSmallIntegerField(
        default=DEFAULT_COMPARE_CONFIG["final_max_shift"]
    )
    final_step = models.PositiveSmallIntegerField(
        default=DEFAULT_COMPARE_CONFIG["final_step"]
    )
    edge_max_shift = models.PositiveSmallIntegerField(
        default=DEFAULT_COMPARE_CONFIG["edge_max_shift"]
    )
    edge_step = models.PositiveSmallIntegerField(
        default=DEFAULT_COMPARE_CONFIG["edge_step"]
    )
    updated_at = models.DateTimeField(auto_now=True)

    @classmethod
    def load(cls):
        config, _ = cls.objects.get_or_create(singleton_id=1)
        return config

    def tuning_config(self):
        return {
            "fast_reject_threshold": self.fast_reject_threshold,
            "base_weight": self.base_weight,
            "edge_weight": self.edge_weight,
            "histogram_weight": self.histogram_weight,
            "grid_weight": self.grid_weight,
            "histogram_penalty_threshold": self.histogram_penalty_threshold,
            "grid_penalty_threshold": self.grid_penalty_threshold,
            "histogram_penalty_multiplier": self.histogram_penalty_multiplier,
            "grid_penalty_multiplier": self.grid_penalty_multiplier,
            "fast_max_shift": self.fast_max_shift,
            "fast_step": self.fast_step,
            "final_max_shift": self.final_max_shift,
            "final_step": self.final_step,
            "edge_max_shift": self.edge_max_shift,
            "edge_step": self.edge_step,
        }

    def __str__(self):
        return "Picture compare live config"
