from django.contrib import admin
from .models import DeviceToken, Notification


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'is_active', 'created_at', 'updated_at']
    list_filter = ['platform', 'is_active', 'created_at']
    search_fields = ['user__username', 'device_token']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('User Info', {
            'fields': ('user',)
        }),
        ('Device Info', {
            'fields': ('device_token', 'platform', 'is_active')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'sent_count', 'created_at']
    list_filter = ['created_at', 'sent_count']
    search_fields = ['user__username', 'title', 'body']
    readonly_fields = ['created_at', 'user']
    fieldsets = (
        ('Notification Content', {
            'fields': ('user', 'title', 'body', 'data')
        }),
        ('Delivery Info', {
            'fields': ('sent_count', 'created_at')
        }),
    )
