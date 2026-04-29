from django.contrib import admin

from apps.admin_dashboard.models import BanRecord, Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "reporter",
        "content_type",
        "content_id",
        "status",
        "created_at",
    ]
    list_filter = ["status", "content_type"]
    search_fields = ["reason", "admin_notes"]
    readonly_fields = ["created_at"]


@admin.register(BanRecord)
class BanRecordAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "banned_by", "is_active", "banned_at", "expires_at"]
    list_filter = ["is_active"]
    search_fields = ["reason"]
    readonly_fields = ["banned_at"]
