from django.conf import settings
from django.db import models


class Report(models.Model):
    TOUR = "TOUR"
    REVIEW = "REVIEW"
    USER = "USER"

    CONTENT_TYPE_CHOICES = [
        (TOUR, "Tour"),
        (REVIEW, "Review"),
        (USER, "User"),
    ]

    PENDING = "PENDING"
    REVIEWED = "REVIEWED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (REVIEWED, "Reviewed"),
        (RESOLVED, "Resolved"),
        (DISMISSED, "Dismissed"),
    ]

    INAPPROPRIATE = "INAPPROPRIATE"
    HATE_OR_HARASSMENT = "HATE_OR_HARASSMENT"
    SPAM = "SPAM"
    MISLEADING = "MISLEADING"
    SAFETY = "SAFETY"
    PRIVACY = "PRIVACY"
    OTHER = "OTHER"

    CATEGORY_CHOICES = [
        (INAPPROPRIATE, "Inappropriate content"),
        (HATE_OR_HARASSMENT, "Hate or harassment"),
        (SPAM, "Spam"),
        (MISLEADING, "Misleading information"),
        (SAFETY, "Safety concern"),
        (PRIVACY, "Privacy concern"),
        (OTHER, "Other"),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="filed_reports",
    )
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPE_CHOICES)
    content_id = models.PositiveBigIntegerField()
    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES, default=OTHER)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=PENDING)
    admin_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="resolved_reports",
    )

    class Meta:
        db_table = "report"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.id} ({self.content_type} {self.content_id})"


class BanRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="ban_records",
    )
    banned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="bans_issued",
    )
    reason = models.TextField()
    is_active = models.BooleanField(default=True)
    banned_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True, blank=True, help_text="Null means permanent ban"
    )
    unbanned_at = models.DateTimeField(null=True, blank=True)
    unbanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bans_lifted",
    )

    class Meta:
        db_table = "ban_record"
        ordering = ["-banned_at"]

    def __str__(self):
        status = "active" if self.is_active else "lifted"
        return f"Ban on {self.user} ({status})"
