import json
import logging
import math
import os
import re
import uuid
from urllib.error import URLError
from urllib.request import urlopen
from typing import Optional

import google.generativeai as genai
from django.core.files.base import ContentFile
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
    PLACE_PHOTO_TIMEOUT_SECONDS = 10
    PLACE_PHOTO_MAX_BYTES = 10 * 1024 * 1024

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
        country: str = "",
        country_code: str = "",
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
        location_query = self._format_location(city, country)
        candidate_places = self._discover_places(location_query, theme, num_steps)
        candidate_places = self._cluster_candidates(
            candidate_places, keep=max(num_steps * 3, 12)
        )

        if not candidate_places:
            raise ValueError(
                f"Could not find any real places for theme '{theme}' in "
                f"'{location_query}'. Please try a different city or theme."
            )

        # ---- Step 2: Build RAG prompt with verified places ----
        prompt = self._build_prompt(
            location_query,
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
        maps_facade = GoogleMapsFacade()

        # Build a lookup of verified places by name (case-insensitive)
        places_lookup = {p["name"].strip().lower(): p for p in candidate_places}
        selected_places_by_step: list[Optional[dict]] = []
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
                    verified_lat, verified_lng = maps_facade.geocode_location(
                        name=step_data["title"],
                        city=location_query,
                        fallback_lat=step_data.get("latitude", 0),
                        fallback_lng=step_data.get("longitude", 0),
                    )
                    step_data["latitude"] = verified_lat
                    step_data["longitude"] = verified_lng
            selected_places_by_step.append(matched_place)

        cover_image_attribution = ""
        cover_image_bytes: Optional[bytes] = None
        cover_image_ext = ".jpg"
        if selected_places_by_step:
            first_place = selected_places_by_step[0]
            first_place_id = (
                str(first_place.get("place_id"))
                if isinstance(first_place, dict) and first_place.get("place_id")
                else ""
            )
            if first_place_id:
                photo_data = maps_facade.get_place_photo(first_place_id)
                if isinstance(photo_data, dict):
                    photo_url = photo_data.get("url", "") or ""
                    cover_image_attribution = photo_data.get("attribution", "") or ""
                    downloaded = self._download_place_photo(photo_url)
                    if downloaded:
                        cover_image_bytes, cover_image_ext = downloaded
                else:
                    logger.warning(
                        "No Google Places photo found for AI tour cover (place_id=%s)",
                        first_place_id,
                    )
            else:
                logger.warning(
                    "No place_id found for first AI tour step; skipping cover image."
                )

        # ---- Step 4b: Reorder stops geometrically to eliminate zigzag ----
        tour_data["steps"] = self._nearest_neighbor_order(tour_data["steps"])

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
                country=country,
                country_code=country_code,
                cover_image_attribution=cover_image_attribution,
                status=Tour.ARCHIVED,
            )
            if cover_image_bytes:
                filename = f"ai_tour_cover_{uuid.uuid4().hex}{cover_image_ext}"
                tour.cover_image.save(
                    filename,
                    ContentFile(cover_image_bytes),
                    save=False,
                )
                tour.save(update_fields=["cover_image"])

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

    @staticmethod
    def _format_location(city: str, country: str = "") -> str:
        return ", ".join(part for part in (city, country) if part)

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

    OUTLIER_MULTIPLIER = 2.5
    MIN_CANDIDATES_AFTER_TRIM = 4

    @staticmethod
    def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        radius_km = 6371.0
        lat1_rad, lat2_rad = math.radians(lat1), math.radians(lat2)
        dlat = lat2_rad - lat1_rad
        dlng = math.radians(lng2 - lng1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
        )
        return radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    @staticmethod
    def _nearest_neighbor_order(steps: list[dict]) -> list[dict]:
        """Reorder a list of steps so consecutive stops are geographically close.

        Keeps the AI's first step as the entry point (preserving narrative
        intro) and then greedily picks the nearest unvisited stop. Cheap,
        deterministic, and good enough to eliminate visual zigzag for
        small N (typical tours have 4-12 stops).
        """
        if len(steps) < 3:
            return steps

        remaining = list(steps[1:])
        ordered = [steps[0]]
        current = steps[0]
        while remaining:
            nearest_idx = min(
                range(len(remaining)),
                key=lambda i: GeminiService._haversine_km(
                    float(current["latitude"]),
                    float(current["longitude"]),
                    float(remaining[i]["latitude"]),
                    float(remaining[i]["longitude"]),
                ),
            )
            current = remaining.pop(nearest_idx)
            ordered.append(current)
        return ordered

    @staticmethod
    def _cluster_candidates(candidates: list[dict], keep: int) -> list[dict]:
        if len(candidates) < 4:
            return candidates

        avg_lat = sum(float(p["latitude"]) for p in candidates) / len(candidates)
        avg_lng = sum(float(p["longitude"]) for p in candidates) / len(candidates)

        with_dist = [
            (
                p,
                GeminiService._haversine_km(
                    float(p["latitude"]), float(p["longitude"]), avg_lat, avg_lng
                ),
            )
            for p in candidates
        ]
        median_dist = sorted(d for _, d in with_dist)[len(with_dist) // 2]
        threshold = max(median_dist * GeminiService.OUTLIER_MULTIPLIER, 1.5)

        trimmed = [p for p, d in with_dist if d <= threshold]
        if len(trimmed) < GeminiService.MIN_CANDIDATES_AFTER_TRIM:
            with_dist.sort(key=lambda x: x[1])
            return [
                p
                for p, _ in with_dist[
                    : max(keep, GeminiService.MIN_CANDIDATES_AFTER_TRIM)
                ]
            ]
        return trimmed

    # ------------------------------------------------------------------
    # Fuzzy Matching
    # ------------------------------------------------------------------

    @staticmethod
    def _fuzzy_match_place(
        ai_name: str, candidates: list[dict], threshold: float = 0.6
    ) -> Optional[dict]:
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

    STREET_CIRCUITY_FACTOR = 1.3
    WALKING_PACE_M_PER_MIN = 80.0
    CIRCULAR_THRESHOLD_M = 200.0
    LONG_LEG_TRANSPORT_THRESHOLD_M = 2000.0

    def _haversine_fallback_metrics(self, steps_list: list) -> dict:
        if len(steps_list) < 2:
            return {"success": False}

        sorted_steps = sorted(steps_list, key=lambda s: s.order)
        total_distance = 0.0
        max_leg = 0.0

        for a, b in zip(sorted_steps, sorted_steps[1:]):
            straight_m = (
                self._haversine_km(
                    float(a.latitude),
                    float(a.longitude),
                    float(b.latitude),
                    float(b.longitude),
                )
                * 1000
            )
            leg_m = straight_m * self.STREET_CIRCUITY_FACTOR
            total_distance += leg_m
            max_leg = max(max_leg, leg_m)

        end_dist_m = (
            self._haversine_km(
                float(sorted_steps[0].latitude),
                float(sorted_steps[0].longitude),
                float(sorted_steps[-1].latitude),
                float(sorted_steps[-1].longitude),
            )
            * 1000
        )

        return {
            "total_distance": total_distance,
            "walking_distance": total_distance,
            "duration_minutes": int(total_distance / self.WALKING_PACE_M_PER_MIN),
            "elevation_gain": 0.0,
            "max_leg_distance": max_leg,
            "requires_transport": max_leg > self.LONG_LEG_TRANSPORT_THRESHOLD_M,
            "is_circular": end_dist_m < self.CIRCULAR_THRESHOLD_M,
            "success": True,
            "estimated": True,
        }

    def _calculate_metrics(self, tour: Tour) -> None:
        try:
            maps_facade = GoogleMapsFacade()
            steps_list = list(tour.steps.all())
            metrics = maps_facade.calculate_route_metrics(steps_list)

            if not metrics.get("success"):
                logger.info(
                    "Directions API failed for tour %s; using haversine fallback.",
                    tour.pk,
                )
                metrics = self._haversine_fallback_metrics(steps_list)

            if not metrics.get("success"):
                return

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

    @classmethod
    def _content_type_to_extension(cls, content_type: str) -> str:
        ctype = (content_type or "").split(";")[0].strip().lower()
        if ctype == "image/png":
            return ".png"
        if ctype == "image/webp":
            return ".webp"
        return ".jpg"

    @classmethod
    def _download_place_photo(cls, photo_url: str) -> Optional[tuple[bytes, str]]:
        if not photo_url:
            return None
        try:
            with urlopen(
                photo_url, timeout=cls.PLACE_PHOTO_TIMEOUT_SECONDS
            ) as response:
                content_type = response.headers.get("Content-Type", "")
                content = response.read(cls.PLACE_PHOTO_MAX_BYTES + 1)
            if not content or len(content) > cls.PLACE_PHOTO_MAX_BYTES:
                return None
            return (content, cls._content_type_to_extension(content_type))
        except (URLError, TimeoutError, ValueError) as e:
            logger.warning("Failed to download Google Places photo: %s", e)
            return None

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

        if len(candidate_places) >= 2:
            c_lat = sum(float(p["latitude"]) for p in candidate_places) / len(
                candidate_places
            )
            c_lng = sum(float(p["longitude"]) for p in candidate_places) / len(
                candidate_places
            )

            def _area_label(p: dict) -> str:
                d_m = (
                    self._haversine_km(
                        float(p["latitude"]), float(p["longitude"]), c_lat, c_lng
                    )
                    * 1000
                )
                return f" [~{d_m:.0f}m from area centre]"

        else:

            def _area_label(p: dict) -> str:
                return ""

        places_list = "\n".join(
            f"  {i}. \"{p['name']}\" — GPS: ({p['latitude']}, {p['longitude']})"
            + (f" — {p['address']}" if p.get("address") else "")
            + _area_label(p)
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
4. ROUTE COHERENCE: Arrange the selected stops as a smooth itinerary with no big jumps. Consecutive stops should be close to each other (ideally under ~1.5 km / 20 min walk apart) and the path should flow in one general direction or loop — NOT zigzag back and forth between far-apart areas. If a location is far from the others, either skip it or visit it at the start/end so it doesn't break the flow. Use the "[~Xm from area centre]" labels and the GPS coordinates to plan the order.
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
