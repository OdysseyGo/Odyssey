import random
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def is_valid(self):
        return not self.used and timezone.now() < self.created_at + timedelta(minutes=10)

    @classmethod
    def generate_for(cls, user):
        # Delete all previous codes for this user (used or not)
        cls.objects.filter(user=user).delete()
        code = str(random.randint(100000, 999999))
        return cls.objects.create(user=user, code=code)
