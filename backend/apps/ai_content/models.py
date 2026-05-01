import uuid

from django.conf import settings
from django.db import models


class GenerationJob(models.Model):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (RUNNING, "Running"),
        (SUCCESS, "Success"),
        (FAILED, "Failed"),
        (CANCELLED, "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="generation_jobs",
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default=PENDING)
    progress_label = models.CharField(max_length=120, blank=True, default="")
    tour = models.ForeignKey(
        "tours.Tour",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="generation_jobs",
    )
    error = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["creator", "status", "created_at"],
                name="ai_job_user_status_created",
            ),
            models.Index(
                fields=["creator", "status", "updated_at"],
                name="ai_job_user_status_updated",
            ),
        ]

    def __str__(self):
        return f"GenerationJob({self.id}, {self.status})"
