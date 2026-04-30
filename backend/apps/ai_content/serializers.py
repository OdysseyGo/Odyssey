from rest_framework import serializers

AI_TOUR_CATEGORIES = (
    "History",
    "Nature",
    "Art",
    "Food",
    "Architecture",
    "Adventure",
    "Culture",
    "Religious",
    "Shopping",
    "Nightlife",
)


class GenerateTourRequestSerializer(serializers.Serializer):
    """Serializer for AI tour generation request."""

    city = serializers.CharField(max_length=100, help_text="City name (e.g., Paris)")
    country = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        help_text="Country name (e.g., France)",
    )
    country_code = serializers.CharField(
        max_length=2,
        required=False,
        allow_blank=True,
        help_text="ISO 3166-1 alpha-2 country code (e.g., FR)",
    )
    theme = serializers.ChoiceField(
        choices=[(category, category) for category in AI_TOUR_CATEGORIES],
        help_text="Tour category (must match manual tour categories)",
    )
    mode = serializers.ChoiceField(
        choices=[
            ("STORY", "Story Mode"),
            ("PUZZLE", "Puzzle Mode"),
            ("HYBRID", "Hybrid Mode"),
        ],
        help_text="Tour generation mode",
    )
    duration = serializers.IntegerField(
        min_value=15, max_value=180, help_text="Duration in minutes"
    )
    language = serializers.CharField(
        max_length=10, default="en", help_text="Language code (e.g., en, tr)"
    )
    additional_details = serializers.CharField(
        max_length=500,
        required=False,
        allow_blank=True,
        help_text="Additional details for tour generation",
    )


class GenerateTourResponseSerializer(serializers.Serializer):
    """Serializer for AI tour generation response."""

    tour_id = serializers.IntegerField()
    title = serializers.CharField()
    message = serializers.CharField()
