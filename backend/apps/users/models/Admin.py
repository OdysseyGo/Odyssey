from django.db import models

class Admin(models.Model):
    admin_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    hashed_password = models.CharField(max_length=255)

    class Meta:
        db_table = "admin"

    def __str__(self):
        return f"{self.name} (id={self.admin_id})"
