from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    NORMAL = 1
    PREMIUM = 2
    CREATOR = 3

    USER_TYPE_CHOICES = [
        (NORMAL, "Normal"),
        (PREMIUM, "Premium"),
        (CREATOR, "Content Creator"),
    ]

    # Removed user_id, name, hashed_password as AbstractUser handles these
    # (id, username/first_name/last_name, password)

    xp = models.IntegerField(default=0)
    following_count = models.IntegerField(default=0)
    follower_count = models.IntegerField(default=0)
    credit = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    country = models.CharField(max_length=100, blank=True)
    user_type = models.PositiveSmallIntegerField(
        choices=USER_TYPE_CHOICES,
        default=NORMAL,
    )
    tour_count = models.IntegerField(default=0)
    rating = models.FloatField(default=0.0)
    total_walked_km = models.DecimalField(max_digits=12, decimal_places=3, default=0)
    current_login_streak = models.PositiveIntegerField(default=0)
    max_login_streak = models.PositiveIntegerField(default=0)
    last_login_streak_date = models.DateField(blank=True, null=True)
    avatar_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        help_text="DiceBear avatar URL",
    )
    is_banned = models.BooleanField(default=False)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    terms_version = models.CharField(max_length=20, blank=True, default="")

    class Meta:
        db_table = "user"

    def __str__(self):
        return f"{self.username} (id={self.id})"
