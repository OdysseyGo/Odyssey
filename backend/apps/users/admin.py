from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Follow, Admin

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'user_type', 'is_staff')
    list_filter = ('user_type', 'is_staff', 'is_superuser', 'groups')
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Fields', {'fields': ('user_type', 'xp', 'level', 'country', 'tour_count', 'rating')}),
    )

admin.site.register(Follow)
admin.site.register(Admin)
