from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Follow, SearchHistory, User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "user_type",
        "is_staff",
    )
    list_filter = ("user_type", "is_staff", "is_superuser", "groups")
    fieldsets = UserAdmin.fieldsets + (
        (
            "Extra Fields",
            {"fields": ("user_type", "xp", "level", "country", "tour_count", "rating")},
        ),
    )


admin.site.register(Follow)


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "search_type", "query", "searched_at")
    list_filter = ("search_type", "searched_at")
    search_fields = ("user__username", "query")
