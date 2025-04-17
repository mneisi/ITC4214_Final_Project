from django.contrib import admin
from .models import UserProfile, RecentActivity

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'country', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone_number', 'city', 'country')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('User Information', {
            'fields': ('user', 'profile_picture', 'phone_number', 'birth_date')
        }),
        ('Address Information', {
            'fields': ('address', 'city', 'state', 'zip_code', 'country')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )

@admin.register(RecentActivity)
class RecentActivityAdmin(admin.ModelAdmin):
    list_display = ('user', 'activity_type', 'product', 'timestamp')
    list_filter = ('activity_type', 'timestamp')
    search_fields = ('user__username', 'product__name')
    readonly_fields = ('timestamp',)
