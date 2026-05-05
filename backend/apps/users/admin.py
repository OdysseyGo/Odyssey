from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.gamification.models import UserBadge, UserBadgeHistory

from .models import Follow, SearchHistory, User


class UserBadgeInline(admin.TabularInline):
    model = UserBadge
    extra = 0
    can_delete = False
    fields = (
        "badge",
        "city",
        "country_code",
        "mistake_count",
        "source_tour",
        "earned_at",
    )
    readonly_fields = fields
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


class UserBadgeHistoryInline(admin.TabularInline):
    model = UserBadgeHistory
    extra = 0
    can_delete = False
    fields = (
        "badge",
        "event_type",
        "source_tour",
        "city",
        "country_code",
        "mistake_count",
        "earned_at",
    )
    readonly_fields = fields
    show_change_link = True
    verbose_name_plural = "Badge earning history"

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = (
        "username",
        "email",
        "user_type",
        "is_staff",
    )
    search_fields = ("username", "email")
    list_filter = ("user_type", "is_staff", "is_superuser", "groups")
    readonly_fields = ("terms_accepted_at", "terms_version")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        ("Personal info", {"fields": ("email",)}),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
        (
            "Extra Fields",
            {"fields": ("user_type", "xp", "level", "country", "tour_count", "rating")},
        ),
        (
            "Legal",
            {"fields": ("terms_accepted_at", "terms_version")},
        ),
    )
    inlines = (UserBadgeInline, UserBadgeHistoryInline)


admin.site.register(Follow)


@admin.register(SearchHistory)
class SearchHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "search_type", "query", "searched_at")
    list_filter = ("search_type", "searched_at")
    search_fields = ("user__username", "query")
