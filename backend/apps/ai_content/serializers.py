from rest_framework import serializers
from apps.tours.models import Tour

class GenerateTourRequestSerializer(serializers.Serializer):
    """Serializer for AI tour generation request."""
    city = serializers.CharField(max_length=100, help_text="City name (e.g., Paris)")
    theme = serializers.CharField(max_length=100, help_text="Tour theme (e.g., Haunted History)")
    mode = serializers.ChoiceField(
        choices=[("STORY", "Story Mode"), ("PUZZLE", "Puzzle Mode"), ("HYBRID", "Hybrid Mode")],
        help_text="Tour generation mode"
    )
    duration = serializers.IntegerField(min_value=15, max_value=180, help_text="Duration in minutes")
    language = serializers.CharField(max_length=10, default="en", help_text="Language code (e.g., en, tr)")

class GenerateTourResponseSerializer(serializers.Serializer):
    """Serializer for AI tour generation response."""
    tour_id = serializers.IntegerField()
    title = serializers.CharField()
    message = serializers.CharField()
