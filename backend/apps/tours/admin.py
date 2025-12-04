from django.contrib import admin
from .models import Tour, TourStep, Puzzle, Review

class TourStepInline(admin.StackedInline):
    model = TourStep
    extra = 0

@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'tour_type', 'difficulty', 'status', 'created_at')
    list_filter = ('tour_type', 'difficulty', 'status')
    search_fields = ('title', 'description')
    inlines = [TourStepInline]

@admin.register(TourStep)
class TourStepAdmin(admin.ModelAdmin):
    list_display = ('tour', 'order', 'title', 'latitude', 'longitude')
    list_filter = ('tour',)

@admin.register(Puzzle)
class PuzzleAdmin(admin.ModelAdmin):
    list_display = ('step', 'puzzle_type', 'question', 'xp_reward')
    list_filter = ('puzzle_type',)

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('tour', 'user', 'rating', 'created_at')
    list_filter = ('rating',)
