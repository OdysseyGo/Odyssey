from django.db import models
from apps.users.models.User import User

class Follow(models.Model):
    follow_id = models.BigAutoField(primary_key=True)
    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followees",
    )
    followee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "follow"
        unique_together = ("follower", "followee")

    def __str__(self):
        return f"{self.follower.username} -> {self.followee.username}"
