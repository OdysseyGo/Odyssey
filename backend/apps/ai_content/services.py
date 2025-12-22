import json
import os

import google.generativeai as genai

from apps.tours.models import Puzzle, Tour, TourStep
from apps.tours.utils import GoogleMapsFacade


class GeminiService:
    """Generating tours w/ Google Gemini AI."""

    GEMINI_MODEL = "gemini-2.5-flash"  # Upgrade to "gemini-1.5-pro" for better reasoning, but slower speed.

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(self.GEMINI_MODEL)

    def generate_tour(
        self,
        city: str,
        theme: str,
        mode: str,
        duration: int,
        language: str,
        creator,
        custom_prompt: str = "",
    ) -> Tour:
        """
        Generate a complete tour with steps and puzzles.

        Args:
            city: City name (e.g., "Paris")
            theme: Tour theme (e.g., "Haunted History")
            mode: STORY, PUZZLE, or HYBRID
            duration: Approximate duration in minutes
            language: Language for content (e.g., "en", "tr")
            creator: User object who will own the tour
            custom_prompt: Optional user instructions
        """
        prompt = self._build_prompt(
            city, theme, mode, duration, language, custom_prompt
        )

        try:
            # Set a generous timeout (e.g., 600 seconds) to avoid premature termination
            response = self.model.generate_content(
                prompt, request_options={"timeout": 600}
            )
            tour_data = self._parse_response(response.text)
        except Exception as e:
            # Handle API errors or timeouts gracefully
            print(f"AI Generation failed: {e}")
            raise e

        # Create Tour
        tour = Tour.objects.create(
            title=tour_data["title"],
            description=tour_data["description"],
            creator=creator,
            tour_type=mode,
            category=theme,
            difficulty=tour_data.get("difficulty", "MEDIUM"),
            duration_minutes=duration,
            city=city,
            status=Tour.DRAFT,  # Start as draft so creator can review
        )

        # Create Steps and Puzzles
        for idx, step_data in enumerate(tour_data["steps"], start=1):
            step = TourStep.objects.create(
                tour=tour,
                order=idx,
                title=step_data["title"],
                description=step_data["description"],
                latitude=step_data["latitude"],
                longitude=step_data["longitude"],
            )

            # Create puzzle if present (for PUZZLE and HYBRID modes)
            if "puzzle" in step_data and step_data["puzzle"]:
                puzzle_data = step_data["puzzle"]
                Puzzle.objects.create(
                    step=step,
                    puzzle_type=puzzle_data.get("type", "TRIVIA"),
                    question=puzzle_data["question"],
                    options=puzzle_data.get("options"),
                    correct_answer=puzzle_data["answer"],
                    hint=puzzle_data.get("hint", ""),
                    xp_reward=puzzle_data.get("xp", 25),
                )

        # Calculate real-world metrics (Distance & Duration)
        try:
            maps_facade = GoogleMapsFacade()
            steps_list = list(tour.steps.all())
            metrics = maps_facade.calculate_route_metrics(steps_list)

            if metrics.get("success"):
                tour.total_distance = metrics.get("total_distance", 0.0)
                tour.walking_distance = metrics.get("walking_distance", 0.0)
                tour.elevation_gain = metrics.get("elevation_gain", 0.0)
                tour.max_leg_distance = metrics.get("max_leg_distance", 0.0)
                tour.requires_transport = metrics.get("requires_transport", False)
                tour.is_circular = metrics.get("is_circular", False)

                # If calculated duration differs significantly, we update it.
                # Or just overwrite AI's guess. Let's overwrite for accuracy.
                calc_duration = metrics.get("duration_minutes", 0)
                if calc_duration > 0:
                    tour.duration_minutes = calc_duration

                tour.metrics_calculated = True

                # Calculate Accessibility Rating
                tour.accessibility_rating = maps_facade.estimate_accessibility(metrics)

                tour.save()
        except Exception as e:
            # Fallback: keep AI generated values and log error (or print for now)
            print(f"Failed to calculate route metrics: {e}")

        return tour

    def _build_prompt(
        self,
        city: str,
        theme: str,
        mode: str,
        duration: int,
        language: str,
        custom_prompt: str = "",
    ) -> str:
        """Structured prompt for Gemini"""

        mode_instructions = {
            "STORY": "Focus on rich narrative storytelling. Each step should have detailed historical or thematic descriptions that immerse the user in the story. No puzzles needed.",
            "PUZZLE": "Focus on interactive challenges. Each step MUST have a puzzle (trivia question, riddle, or observation task). Keep descriptions brief.",
            "HYBRID": "Balance storytelling with puzzles. Each step should have both a narrative description AND a puzzle challenge.",
        }

        puzzle_schema = """
        "puzzle": {
            "type": "TRIVIA",
            "question": "What year was this building constructed?",
            "options": ["1850", "1875", "1900", "1925"],
            "answer": "1875",
            "hint": "It was built during the Victorian era",
            "xp": 25
        }"""

        num_steps = max(3, duration // 15)  # Roughly 15 min per step

        puzzle_field = '"puzzle": {...}' if mode in ["PUZZLE", "HYBRID"] else ""
        puzzle_instruction = (
            "Puzzle schema for each step:" + puzzle_schema
            if mode in ["PUZZLE", "HYBRID"]
            else ""
        )

        user_instruction = (
            f"\nADDITIONAL USER INSTRUCTIONS: {custom_prompt}\n"
            if custom_prompt
            else ""
        )

        prompt = f"""You are a tour guide AI. Generate a {mode} tour in {city} with the theme "{theme}".
{user_instruction}
LANGUAGE: Generate all content in {language}.
DURATION: {duration} minutes (approximately {num_steps} locations).
MODE: {mode} - {mode_instructions.get(mode, mode_instructions["HYBRID"])}

IMPORTANT REQUIREMENTS:
1. Use REAL locations with accurate GPS coordinates in {city}.
2. Create a logical walking route between locations.
3. Make the narrative engaging and connected to the theme.

OUTPUT FORMAT (strict JSON):
{{
    "title": "Tour title",
    "description": "Brief tour description",
    "difficulty": "EASY" or "MEDIUM" or "HARD",
    "steps": [
        {{
            "title": "Location name",
            "description": "Narrative/story content for this location",
            "latitude": 48.8584,
            "longitude": 2.2945{', ' + puzzle_field if puzzle_field else ''}
        }}
    ]
}}

{puzzle_instruction}

Generate the tour now:"""

        return prompt

    def _parse_response(self, response_text: str) -> dict:
        """Parse Gemini's response (JSON)."""
        # this is to clean up response
        # Gemini sometimes wraps JSON in markdown
        text = response_text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        try:
            return json.loads(text.strip())
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {e}")
