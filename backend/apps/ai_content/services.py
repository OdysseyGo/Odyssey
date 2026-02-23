import json
import logging
import os
import re

import google.generativeai as genai
from django.db import transaction

from apps.tours.models import Puzzle, Tour, TourStep
from apps.tours.utils import GoogleMapsFacade

logger = logging.getLogger(__name__)


class GeminiService:
    """Generating tours w/ Google Gemini AI."""

    GEMINI_MODEL = "gemini-2.5-flash"  # Upgrade to "gemini-1.5-pro" for better reasoning, but slower speed.

    # Estimated time a user spends at each stop (reading, exploring, solving puzzles)
    MINUTES_PER_STEP = 5

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
            logger.error("AI Generation failed: %s", e)
            raise

        # Validate required keys before touching the database
        self._validate_tour_data(tour_data, mode)

        # Wrap all DB writes in an atomic transaction so a mid-way failure
        # doesn't leave orphaned Tour / TourStep rows in the database.
        with transaction.atomic():
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
                status=Tour.ARCHIVED,  # Start as draft so creator can review
            )

            # Create Steps and Puzzles
            for idx, step_data in enumerate(tour_data["steps"], start=1):
                step = TourStep.objects.create(
                    tour=tour,
                    order=idx,
                    title=step_data["title"],
                    description=step_data.get("description", ""),
                    latitude=step_data["latitude"],
                    longitude=step_data["longitude"],
                )

                # Create puzzle if present (for PUZZLE and HYBRID modes)
                puzzle_data = step_data.get("puzzle")
                if puzzle_data:
                    Puzzle.objects.create(
                        step=step,
                        puzzle_type=puzzle_data.get("type", "TRIVIA"),
                        question=puzzle_data["question"],
                        options=puzzle_data.get("options"),
                        correct_answer=puzzle_data["answer"],
                        hint=puzzle_data.get("hint", ""),
                        xp_reward=puzzle_data.get("xp", 25),
                    )
                elif mode in ("PUZZLE", "HYBRID"):
                    # AI omitted the puzzle — create a fallback so every step
                    # in puzzle-requiring modes has something to interact with.
                    Puzzle.objects.create(
                        step=step,
                        puzzle_type="TRIVIA",
                        question="What is the name of this location?",
                        options=[
                            step_data["title"],
                            "Unknown Place",
                            "Central Park",
                            "The Grand Palace",
                        ],
                        correct_answer=step_data["title"],
                        hint="Look at the sign or landmark nearby.",
                        xp_reward=10,
                    )

        # Calculate real-world metrics (Distance & Duration) — outside the
        # atomic block because a Maps API failure shouldn't roll back the tour.
        self._calculate_metrics(tour)

        return tour

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @staticmethod
    def _validate_tour_data(tour_data: dict, mode: str) -> None:
        """
        Validate that the parsed AI response has all required keys and
        sane structure before attempting database writes.

        Raises ValueError with a human-readable message on failure.
        """
        missing = [
            key for key in ("title", "description", "steps") if key not in tour_data
        ]
        if missing:
            raise ValueError(
                f"AI response is missing required keys: {', '.join(missing)}"
            )

        steps = tour_data["steps"]
        if not isinstance(steps, list) or len(steps) == 0:
            raise ValueError(
                "AI response 'steps' must be a non-empty list, "
                f"got {type(steps).__name__}"
            )

        for i, step in enumerate(steps):
            for key in ("title", "latitude", "longitude"):
                if key not in step:
                    raise ValueError(f"Step {i + 1} is missing required key '{key}'")

    # ------------------------------------------------------------------
    # Metrics
    # ------------------------------------------------------------------

    def _calculate_metrics(self, tour: Tour) -> None:
        """Calculate real-world route metrics and update the tour in-place."""
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

                # Combine walking time with per-step exploration time so the
                # estimate reflects the full experience, not just transit.
                walking_minutes = metrics.get("duration_minutes", 0)
                exploration_minutes = len(steps_list) * self.MINUTES_PER_STEP
                total_duration = walking_minutes + exploration_minutes
                if total_duration > 0:
                    tour.duration_minutes = total_duration

                tour.metrics_calculated = True

                # Calculate Accessibility Rating
                tour.accessibility_rating = maps_facade.estimate_accessibility(metrics)

                tour.save()
        except Exception as e:
            # Fallback: keep AI generated values and log the error
            logger.warning("Failed to calculate route metrics: %s", e)

    # ------------------------------------------------------------------
    # Prompt
    # ------------------------------------------------------------------

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

    # ------------------------------------------------------------------
    # Parsing
    # ------------------------------------------------------------------

    def _parse_response(self, response_text: str) -> dict:
        """Parse Gemini's response (JSON).

        Handles common LLM quirks:
        - Markdown code fences (```json ... ```)
        - Leading prose before the JSON object
        """
        text = response_text.strip()

        # Strip markdown code fences
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]

        text = text.strip()

        # First try a direct parse (fast path)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Fallback: extract the first top-level JSON object from the text.
        # This handles cases where the LLM adds prose before/after the JSON.
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(
            "Failed to parse AI response as JSON. "
            "The model did not return valid JSON."
        )
