from django.contrib import admin

from .models import (
    ARModel,
    ArPuzzleDetail,
    CompassPuzzleDetail,
    GyroscopePuzzleDetail,
    PictureComparePuzzleDetail,
    Puzzle,
    Review,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)


class TourStepInline(admin.StackedInline):
    model = TourStep
    extra = 0


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "creator",
        "tour_type",
        "difficulty",
        "status",
        "created_at",
    )
    list_filter = ("tour_type", "difficulty", "status")
    search_fields = ("title", "description")
    inlines = [TourStepInline]


@admin.register(TourStep)
class TourStepAdmin(admin.ModelAdmin):
    list_display = ("tour", "order", "title", "latitude", "longitude")
    list_filter = ("tour",)


@admin.register(Puzzle)
class PuzzleAdmin(admin.ModelAdmin):
    list_display = ("step", "puzzle_type", "question", "xp_reward", "updated_at")
    list_filter = ("puzzle_type",)


@admin.register(TriviaPuzzleDetail)
class TriviaPuzzleDetailAdmin(admin.ModelAdmin):
    list_display = ("puzzle", "correct_answer")


@admin.register(PictureComparePuzzleDetail)
class PictureComparePuzzleDetailAdmin(admin.ModelAdmin):
    list_display = ("puzzle", "similarity_threshold")


@admin.register(ArPuzzleDetail)
class ArPuzzleDetailAdmin(admin.ModelAdmin):
    list_display = ("puzzle", "scene_asset_url")


@admin.register(GyroscopePuzzleDetail)
class GyroscopePuzzleDetailAdmin(admin.ModelAdmin):
    list_display = (
        "puzzle",
        "target_pitch",
        "target_roll",
        "target_yaw",
        "tolerance_degrees",
    )


@admin.register(CompassPuzzleDetail)
class CompassPuzzleDetailAdmin(admin.ModelAdmin):
    list_display = ("puzzle", "target_heading_degrees")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("tour", "user", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(ARModel)
class ARModelAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "slug",
        "is_active",
        "sort_order",
        "updated_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name", "slug")
