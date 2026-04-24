from django.conf import settings
from django.db import models


class Badge(models.Model):
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
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "badge")

    def __str__(self):
        return f"{self.user} earned {self.badge}"


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
    # Points into tour_snapshot["steps"] — not a DB FK, so it survives the
    # original TourStep being edited or deleted.
    current_step_id = models.IntegerField(null=True, blank=True)
    tour_snapshot = models.JSONField(
        null=True,
        blank=True,
        help_text="Frozen tour payload (steps + puzzles) captured when progress started.",
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=IN_PROGRESS
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_xp = models.IntegerField(default=0)
    skip_count = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.user} - {self.tour} ({self.status})"
