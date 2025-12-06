from django.conf import settings
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

    def __str__(self) -> str:
        return f"{self.username} (id={self.id})"


class Admin(models.Model):
    admin_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    hashed_password = models.CharField(max_length=255)

    class Meta:
        db_table = "admin"

    def __str__(self) -> str:
        return f"{self.name} (id={self.admin_id})"


class Follow(models.Model):
    follow_id = models.BigAutoField(primary_key=True)
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followees",
    )
    followee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follow"
        unique_together = ("follower", "followee")

    def __str__(self) -> str:
        return f"{self.follower.username} -> {self.followee.username}"