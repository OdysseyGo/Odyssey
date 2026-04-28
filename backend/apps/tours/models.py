import os
import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


def puzzle_reference_image_upload_to(instance, filename):
    ext = os.path.splitext(filename or "")[1].lower() or ".jpg"
    return f"puzzle_reference_images/{uuid.uuid4().hex}{ext}"


def ar_model_preview_upload_to(instance, filename):
    ext = os.path.splitext(filename or "")[1].lower() or ".png"
    return f"ar_models/previews/{uuid.uuid4().hex}{ext}"


def ar_model_scene_asset_upload_to(instance, filename):
    ext = os.path.splitext(filename or "")[1].lower() or ".glb"
    return f"ar_models/scenes/{uuid.uuid4().hex}{ext}"


class Tour(models.Model):
    STORY = "STORY"
    PUZZLE = "PUZZLE"
    HYBRID = "HYBRID"

    TOUR_TYPE_CHOICES = [
        (STORY, "Story Mode"),
        (PUZZLE, "Puzzle Mode"),
        (HYBRID, "Hybrid Mode"),
    ]

    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"

    DIFFICULTY_CHOICES = [
        (EASY, "Easy"),
        (MEDIUM, "Medium"),
        (HARD, "Hard"),
    ]

    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

    STATUS_CHOICES = [
        (DRAFT, "Draft"),
        (PUBLISHED, "Published"),
        (ARCHIVED, "Archived"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_tours"
    )
    tour_type = models.CharField(max_length=20, choices=TOUR_TYPE_CHOICES)
    category = models.CharField(max_length=100)
    difficulty = models.CharField(
        max_length=20, choices=DIFFICULTY_CHOICES, default=MEDIUM
    )
    duration_minutes = models.PositiveIntegerField(
        help_text="Estimated duration in minutes"
    )
    is_premium = models.BooleanField(default=False)
    city = models.CharField(
        max_length=100, blank=True, help_text="City where the tour is located"
    )
    country = models.CharField(
        max_length=100, blank=True, help_text="Country where the tour is located"
    )
    country_code = models.CharField(
        max_length=2,
        blank=True,
        help_text="ISO 3166-1 alpha-2 country code for the tour country",
    )
    cover_image = models.ImageField(upload_to="tour_covers/", blank=True, null=True)

    # Advanced Metrics
    total_distance = models.FloatField(
        default=0.0, help_text="Total distance in meters"
    )
    walking_distance = models.FloatField(
        default=0.0, help_text="Distance covered by walking in meters"
    )
    transport_distance = models.FloatField(
        default=0.0, help_text="Distance covered by public transport in meters"
    )

    # New Accessibility Metrics
    elevation_gain = models.FloatField(
        default=0.0, help_text="Cumulative elevation gain in meters"
    )
    max_leg_distance = models.FloatField(
        default=0.0, help_text="Longest single walking segment in meters"
    )
    requires_transport = models.BooleanField(
        default=False,
        help_text="True if any segment requires public transport (heuristic > 2km)",
    )
    is_circular = models.BooleanField(
        default=False, help_text="True if route ends near the start point (< 200m)"
    )

    metrics_calculated = models.BooleanField(
        default=False,
        help_text="True if real-world metrics have been calculated via API",
    )
    accessibility_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        help_text="1-10 rating. 10=Most Accessible (Flat, Short). 1=Least (Steep, Long, Complex)",
    )

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class TourStep(models.Model):
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name="steps")
    order = models.PositiveIntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(
        help_text="Story content or location description", blank=True
    )
    latitude = models.DecimalField(max_digits=18, decimal_places=9)
    longitude = models.DecimalField(max_digits=18, decimal_places=9)
    image = models.ImageField(upload_to="tour_steps/", blank=True, null=True)
    audio = models.FileField(upload_to="tour_audio/", blank=True, null=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.tour.title} - Step {self.order}"


class ARModel(models.Model):
    slug = models.SlugField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    preview_image_url = models.URLField(blank=True)
    scene_asset_url = models.URLField(blank=True)
    preview_image = models.ImageField(
        upload_to=ar_model_preview_upload_to,
        blank=True,
        null=True,
    )
    scene_asset_file = models.FileField(
        upload_to=ar_model_scene_asset_upload_to,
        blank=True,
        null=True,
    )
    anchors = models.JSONField(
        default=list,
        blank=True,
        help_text="Anchor definitions with stable ids and xyz coordinates.",
    )
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self):
        return self.name

    @staticmethod
    def _absolute_media_url(url, request=None):
        if not url:
            return ""
        if request and not url.startswith(("http://", "https://")):
            normalized = url if url.startswith("/") else f"/{url.lstrip('/')}"
            return request.build_absolute_uri(normalized)
        return url

    def get_preview_image_url(self, request=None):
        if self.preview_image:
            return self._absolute_media_url(self.preview_image.url, request=request)
        return self._absolute_media_url(self.preview_image_url, request=request)

    def get_scene_asset_url(self, request=None):
        if self.scene_asset_file:
            return self._absolute_media_url(self.scene_asset_file.url, request=request)
        return self._absolute_media_url(self.scene_asset_url, request=request)


class Puzzle(models.Model):
    TRIVIA = "TRIVIA"
    AR = "AR"
    GYROSCOPE = "GYROSCOPE"
    PICTURE_COMPARE = "PICTURE_COMPARE"
    COMPASS = "COMPASS"

    PUZZLE_TYPE_CHOICES = [
        (TRIVIA, "Trivia"),
        (AR, "Augmented Reality"),
        (GYROSCOPE, "Gyroscope"),
        (PICTURE_COMPARE, "Picture Compare"),
        (COMPASS, "Compass"),
    ]

    step = models.OneToOneField(
        TourStep, on_delete=models.CASCADE, related_name="puzzle"
    )
    puzzle_type = models.CharField(max_length=20, choices=PUZZLE_TYPE_CHOICES)
    question = models.TextField()
    options = models.JSONField(
        help_text="JSON structure for multiple choice options", blank=True, null=True
    )
    correct_answer = models.CharField(max_length=255)
    hint = models.TextField(blank=True)
    xp_reward = models.PositiveIntegerField(default=10)
    reference_image = models.ImageField(
        upload_to=puzzle_reference_image_upload_to, blank=True, null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Puzzle for {self.step}"


class TriviaPuzzleDetail(models.Model):
    puzzle = models.OneToOneField(
        Puzzle, on_delete=models.CASCADE, related_name="trivia_detail"
    )
    options = models.JSONField(
        default=list,
        help_text="Multiple choice options for TRIVIA puzzles",
    )
    correct_answer = models.CharField(max_length=255)

    def clean(self):
        if self.puzzle.puzzle_type != Puzzle.TRIVIA:
            raise ValidationError(
                {"puzzle": "TriviaPuzzleDetail can only be attached to TRIVIA puzzles."}
            )

    def __str__(self):
        return f"Trivia detail for puzzle {self.puzzle.pk}"


class PictureComparePuzzleDetail(models.Model):
    puzzle = models.OneToOneField(
        Puzzle,
        on_delete=models.CASCADE,
        related_name="picture_compare_detail",
    )
    reference_image = models.ImageField(upload_to=puzzle_reference_image_upload_to)
    similarity_threshold = models.FloatField(default=0.7)

    def clean(self):
        if self.puzzle.puzzle_type != Puzzle.PICTURE_COMPARE:
            raise ValidationError(
                {
                    "puzzle": (
                        "PictureComparePuzzleDetail can only be attached to "
                        "PICTURE_COMPARE puzzles."
                    )
                }
            )

    def __str__(self):
        return f"Picture compare detail for puzzle {self.puzzle.pk}"


class ArPuzzleDetail(models.Model):
    puzzle = models.OneToOneField(
        Puzzle,
        on_delete=models.CASCADE,
        related_name="ar_detail",
    )
    scene_asset_url = models.URLField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    def clean(self):
        if self.puzzle.puzzle_type != Puzzle.AR:
            raise ValidationError(
                {"puzzle": "ArPuzzleDetail can only be attached to AR puzzles."}
            )

    def __str__(self):
        return f"AR detail for puzzle {self.puzzle.pk}"


class GyroscopePuzzleDetail(models.Model):
    puzzle = models.OneToOneField(
        Puzzle,
        on_delete=models.CASCADE,
        related_name="gyroscope_detail",
    )
    target_pitch = models.FloatField(default=0.0)
    target_roll = models.FloatField(default=0.0)
    target_yaw = models.FloatField(default=0.0)
    tolerance_degrees = models.FloatField(default=15.0)

    def clean(self):
        if self.puzzle.puzzle_type != Puzzle.GYROSCOPE:
            raise ValidationError(
                {
                    "puzzle": (
                        "GyroscopePuzzleDetail can only be attached to "
                        "GYROSCOPE puzzles."
                    )
                }
            )

    def __str__(self):
        return f"Gyroscope detail for puzzle {self.puzzle.pk}"


class CompassPuzzleDetail(models.Model):
    puzzle = models.OneToOneField(
        Puzzle,
        on_delete=models.CASCADE,
        related_name="compass_detail",
    )
    target_heading_degrees = models.PositiveSmallIntegerField(default=0)

    def clean(self):
        if self.puzzle.puzzle_type != Puzzle.COMPASS:
            raise ValidationError(
                {
                    "puzzle": (
                        "CompassPuzzleDetail can only be attached to "
                        "COMPASS puzzles."
                    )
                }
            )

        if not 0 <= self.target_heading_degrees <= 359:
            raise ValidationError(
                {
                    "target_heading_degrees": (
                        "target_heading_degrees must be between 0 and 359."
                    )
                }
            )

    def __str__(self):
        return f"Compass detail for puzzle {self.puzzle.pk}"


class Review(models.Model):
    tour = models.ForeignKey(Tour, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.user} for {self.tour}"


class PuzzleAttempt(models.Model):
    puzzle = models.ForeignKey(
        Puzzle, on_delete=models.CASCADE, related_name="attempts"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="puzzle_attempts",
    )
    progress = models.ForeignKey(
        "gamification.TourProgress",
        on_delete=models.CASCADE,
        related_name="puzzle_attempts",
    )
    similarity_score = models.FloatField(null=True, blank=True)
    accepted = models.BooleanField(default=False)
    processing_ms = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Attempt by {self.user} on puzzle {self.puzzle.pk}"
