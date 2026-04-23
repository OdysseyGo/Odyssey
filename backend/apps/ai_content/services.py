import json
import logging
import os
import re

import google.generativeai as genai
from django.db import transaction

from apps.tours.models import Puzzle, Tour, TourStep, TriviaPuzzleDetail
from apps.tours.utils import GoogleMapsFacade

logger = logging.getLogger(__name__)


class GeminiService:
    """
    RAG-based tour generation with Google Gemini AI.

    Architecture (Maps First, AI Second):
        1. Query Google Maps Places API for real places matching the theme/city.
        2. Feed verified places into the Gemini prompt so the AI can only
           select from real, coordinate-verified locations.
        3. AI writes creative content (stories, puzzles) for the selected places.

    This eliminates geographic hallucinations entirely.
    """

    GEMINI_MODEL = "gemini-2.5-flash"

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
        Generate a complete tour with steps and puzzles using RAG.

        Pipeline:
            1. Discover real places via Google Maps Places API.
            2. Build a prompt that constrains Gemini to those places.
            3. Parse the AI response and validate place selection.
            4. Create Tour, TourStep, and Puzzle objects in the database.
            5. Calculate real-world route metrics.

        Args:
            city: City name (e.g., "Paris")
            theme: Tour theme (e.g., "Haunted History")
            mode: STORY, PUZZLE, or HYBRID
            duration: Approximate duration in minutes
            language: Language for content (e.g., "en", "tr")
            creator: User object who will own the tour
            custom_prompt: Optional user instructions
        """
        # ---- Step 1: Discover real places from Google Maps ----
        num_steps = max(3, duration // 15)
        candidate_places = self._discover_places(city, theme, num_steps)

        if not candidate_places:
            raise ValueError(
                f"Could not find any real places for theme '{theme}' in "
                f"'{city}'. Please try a different city or theme."
            )

        # ---- Step 2: Build RAG prompt with verified places ----
        prompt = self._build_prompt(
            city,
            theme,
            mode,
            duration,
            language,
            custom_prompt,
            candidate_places,
            num_steps,
        )

        # ---- Step 3: Generate creative content via Gemini (with retries) ----
        max_retries = 3
        last_error = None

        for attempt in range(1, max_retries + 1):
            try:
                current_prompt = prompt
                if attempt > 1:
                    # On retries, prepend a stricter instruction
                    current_prompt = (
                        "IMPORTANT: Your previous response was not valid JSON. "
                        "You MUST respond with ONLY a valid JSON object. "
                        "No prose, no markdown, no explanation — just the JSON.\n\n"
                        + prompt
                    )

                response = self.model.generate_content(
                    current_prompt, request_options={"timeout": 600}
                )
                tour_data = self._parse_response(response.text)
                break  # Success — exit retry loop
            except ValueError as e:
                # JSON parse failure — retry
                last_error = e
                logger.warning(
                    "AI response parse failed (attempt %d/%d): %s",
                    attempt,
                    max_retries,
                    e,
                )
            except Exception as e:
                # Non-retryable error (network, timeout, etc.)
                logger.error("AI Generation failed: %s", e)
                raise
        else:
            # All retries exhausted
            logger.error(
                "AI failed to return valid JSON after %d attempts", max_retries
            )
            raise ValueError(
                "AI failed to return a valid tour after multiple attempts. "
                "Please try again."
            ) from last_error

        # ---- Step 4: Validate and enrich with verified coordinates ----
        self._validate_tour_data(tour_data, mode)

        # Build a lookup of verified places by name (case-insensitive)
        places_lookup = {p["name"].strip().lower(): p for p in candidate_places}

        # Replace AI coordinates with verified Google Maps coordinates
        for step_data in tour_data["steps"]:
            step_name = step_data["title"].strip().lower()
            matched_place = places_lookup.get(step_name)

            if matched_place:
                # Use verified Google Maps coordinates
                step_data["latitude"] = matched_place["latitude"]
                step_data["longitude"] = matched_place["longitude"]
            else:
                # AI may have used a slightly different name — fuzzy match
                matched_place = self._fuzzy_match_place(
                    step_data["title"], candidate_places
                )
                if matched_place:
                    step_data["latitude"] = matched_place["latitude"]
                    step_data["longitude"] = matched_place["longitude"]
                else:
                    # Last resort: geocode the AI's title via Google Maps
                    logger.warning(
                        "AI selected '%s' which was not in the candidate list. "
                        "Falling back to geocoding.",
                        step_data["title"],
                    )
                    maps_facade = GoogleMapsFacade()
                    verified_lat, verified_lng = maps_facade.geocode_location(
                        name=step_data["title"],
                        city=city,
                        fallback_lat=step_data.get("latitude", 0),
                        fallback_lng=step_data.get("longitude", 0),
                    )
                    step_data["latitude"] = verified_lat
                    step_data["longitude"] = verified_lng

        # ---- Step 5: Persist to database ----
        with transaction.atomic():
            tour = Tour.objects.create(
                title=tour_data["title"],
                description=tour_data["description"],
                creator=creator,
                tour_type=mode,
                category=theme,
                difficulty=tour_data.get("difficulty", "MEDIUM"),
                duration_minutes=duration,
                city=city,
                status=Tour.ARCHIVED,
            )

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
                    puzzle = Puzzle.objects.create(
                        step=step,
                        puzzle_type=puzzle_data.get("type", "TRIVIA"),
                        question=puzzle_data["question"],
                        options=puzzle_data.get("options"),
                        correct_answer=puzzle_data["answer"],
                        hint=puzzle_data.get("hint", ""),
                        xp_reward=puzzle_data.get("xp", 25),
                    )
                    if puzzle.puzzle_type == Puzzle.TRIVIA:
                        TriviaPuzzleDetail.objects.update_or_create(
                            puzzle=puzzle,
                            defaults={
                                "options": puzzle.options or [],
                                "correct_answer": puzzle.correct_answer,
                            },
                        )
                elif mode in ("PUZZLE", "HYBRID"):
                    puzzle = Puzzle.objects.create(
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
                    TriviaPuzzleDetail.objects.update_or_create(
                        puzzle=puzzle,
                        defaults={
                            "options": puzzle.options or [],
                            "correct_answer": puzzle.correct_answer,
                        },
                    )

        # ---- Step 6: Calculate real-world metrics ----
        self._calculate_metrics(tour)

        return tour

    # ------------------------------------------------------------------
    # Place Discovery (RAG — Retrieval Step)
    # ------------------------------------------------------------------

    def _discover_places(self, city: str, theme: str, num_steps: int) -> list[dict]:
        """
        Retrieve real, verified places from Google Maps.

        Requests more candidates than needed so the AI has a rich pool to
        choose from.  Typically fetches 3× the required number of steps.
        """
        maps_facade = GoogleMapsFacade()
        max_candidates = max(num_steps * 3, 15)
        return maps_facade.search_places(
            city=city, theme=theme, max_results=max_candidates
        )

    # ------------------------------------------------------------------
    # Fuzzy Matching
    # ------------------------------------------------------------------

    @staticmethod
    def _fuzzy_match_place(
        ai_name: str, candidates: list[dict], threshold: float = 0.6
    ) -> dict | None:
        """
        Find the best matching candidate place for an AI-generated name.

        Uses simple token-overlap similarity.  Returns the best match if
        the similarity score is above `threshold`, otherwise None.
        """
        ai_tokens = set(ai_name.strip().lower().split())
        if not ai_tokens:
            return None

        best_match = None
        best_score = 0.0

        for place in candidates:
            place_tokens = set(place["name"].strip().lower().split())
            if not place_tokens:
                continue
            overlap = len(ai_tokens & place_tokens)
            total = len(ai_tokens | place_tokens)
            score = overlap / total if total else 0
            if score > best_score:
                best_score = score
                best_match = place

        return best_match if best_score >= threshold else None

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
            if "title" not in step:
                raise ValueError(f"Step {i + 1} is missing required key 'title'")

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

                walking_minutes = metrics.get("duration_minutes", 0)
                exploration_minutes = len(steps_list) * self.MINUTES_PER_STEP
                total_duration = walking_minutes + exploration_minutes
                if total_duration > 0:
                    tour.duration_minutes = total_duration

                tour.metrics_calculated = True
                tour.accessibility_rating = maps_facade.estimate_accessibility(metrics)
                tour.save()
        except Exception as e:
            logger.warning("Failed to calculate route metrics: %s", e)

    # ------------------------------------------------------------------
    # Prompt (RAG — Augmented Generation Step)
    # ------------------------------------------------------------------

    def _build_prompt(
        self,
        city: str,
        theme: str,
        mode: str,
        duration: int,
        language: str,
        custom_prompt: str,
        candidate_places: list[dict],
        num_steps: int,
    ) -> str:
        """
        Build a RAG prompt that constrains Gemini to select from verified
        Google Maps places.
        """
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

        # Format verified places as a numbered list for the prompt
        places_list = "\n".join(
            f"  {i}. \"{p['name']}\" — GPS: ({p['latitude']}, {p['longitude']})"
            + (f" — {p['address']}" if p.get("address") else "")
            for i, p in enumerate(candidate_places, start=1)
        )

        prompt = f"""You are a tour guide AI. Generate a {mode} tour in {city} with the theme "{theme}".
{user_instruction}
LANGUAGE: Generate all content in {language}.
DURATION: {duration} minutes (select exactly {num_steps} locations from the list below).
MODE: {mode} - {mode_instructions.get(mode, mode_instructions["HYBRID"])}

═══════════════════════════════════════════════════════════════
VERIFIED LOCATIONS (from Google Maps — you MUST choose from this list):
═══════════════════════════════════════════════════════════════
{places_list}

CRITICAL RULES:
1. You MUST select exactly {num_steps} locations from the VERIFIED LOCATIONS list above.
2. Do NOT invent, fabricate, or hallucinate any new locations.
3. Use the EXACT name and GPS coordinates provided in the list above.
4. Arrange the selected locations in a logical walking order to minimize backtracking.
5. Write engaging, theme-connected narrative content for each selected location.

OUTPUT FORMAT (strict JSON):
{{
    "title": "Tour title",
    "description": "Brief tour description",
    "difficulty": "EASY" or "MEDIUM" or "HARD",
    "steps": [
        {{
            "title": "Exact location name from the list above",
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
