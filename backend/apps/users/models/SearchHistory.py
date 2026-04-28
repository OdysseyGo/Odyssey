from django.conf import settings
from django.db import models


class SearchHistory(models.Model):
    TOURS = "tours"
    USERS = "users"

    SEARCH_TYPE_CHOICES = [
        (TOURS, "Tours"),
        (USERS, "Users"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="search_history",
    )
    search_type = models.CharField(max_length=16, choices=SEARCH_TYPE_CHOICES)
    query = models.CharField(max_length=255)
    searched_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_search_history"
        ordering = ["-searched_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "search_type", "query"],
                name="unique_user_search_history_query",
            )
        ]

    def __str__(self):
        return f"{self.user_id}:{self.search_type}:{self.query}"
