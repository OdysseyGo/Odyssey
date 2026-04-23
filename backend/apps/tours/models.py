from django.conf import settings
from django.db import models


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


class Puzzle(models.Model):
    TRIVIA = "TRIVIA"
    AR = "AR"
    GYROSCOPE = "GYROSCOPE"

    PUZZLE_TYPE_CHOICES = [
        (TRIVIA, "Trivia"),
        (AR, "Augmented Reality"),
        (GYROSCOPE, "Gyroscope"),
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

    def __str__(self):
        return f"Puzzle for {self.step}"


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
