from django.db import models
from django.contrib.auth.models import AbstractUser

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
    follow_count = models.IntegerField(default=0)
    follower_count = models.IntegerField(default=0)
    token = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    country = models.CharField(max_length=100, blank=True)
    user_type = models.PositiveSmallIntegerField(
        choices=USER_TYPE_CHOICES,
        default=NORMAL,
    )
    tour_count = models.IntegerField(default=0)
    rating = models.FloatField(default=0.0)

    class Meta:
        db_table = "user"

    def __str__(self):
        return f"{self.username} (id={self.id})"
