import json
import logging
import math
import os
import random
import re
import string
import threading
import uuid
from typing import Optional
from urllib.error import URLError
from urllib.request import urlopen

import google.generativeai as genai
from django.core.files.base import ContentFile
from django.db import connection, transaction

from apps.tours.models import (
    ARModel,
    ArPuzzleDetail,
    CompassPuzzleDetail,
    Puzzle,
    Tour,
    TourStep,
    TriviaPuzzleDetail,
)
from apps.tours.utils import GoogleMapsFacade, normalize_tour_country

AR_SECRET_CODE_REGEX = re.compile(r"^[A-Za-z0-9]{4,12}$")
TRIVIA_OPTION_LABEL_REGEX = re.compile(r"\b[A-H][).:]\s+\S")
TRIVIA_OPTION_PREFIX_REGEX = re.compile(r"^\s*[A-H][).:]\s*")
AR_MIN_SCALE = 0.3
AR_MAX_SCALE = 10.0
AR_DEFAULT_SCALE = 1.0

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


    def _plan_search_queries(self, city: str, theme: str, custom_prompt: str) -> list[str]:
        """
        Acts as a 'Query Planner' using AI to translate abstract user requests 
        into concrete search terms that Google Maps can understand.
        """
        if not custom_prompt:
            return [theme]

        prompt = f"""
        You are a tour planning assistant. The user wants a "{theme}" themed tour in {city}.
        They also have this specific request: "{custom_prompt}"
        
        To help me find suitable locations on Google Maps, generate a maximum of 5 search queries.
        
        CRITICAL RULES:
        1. GEOGRAPHIC VALIDATION: First, analyze if the user's specifically requested neighborhood, landmark, or district (if any) actually exists within or near the city of {city}. 
           - If it is NOT in {city}, completely IGNORE their specific location request and generate queries for the general {city} area.
        2. LOCATION BINDING: If the user specifies a valid area that IS in {city} (e.g., "Dallas" in "Texas"), you MUST append that area to EVERY query you generate (e.g., "parks in Dallas", "historical sites in Dallas").
        3. Translate abstract ideas into physical place categories.
        4. Do NOT provide exact single venue names, only categorical queries bounded by the validated location.
        
        Return ONLY a valid JSON array of strings in English. Do not include any other text or explanation.
        """
        try:
            # Keep timeout low for the planning step to ensure a quick response
            response = self.model.generate_content(prompt, request_options={"timeout": 10})
            queries = self._parse_response(response.text)
            
            if isinstance(queries, list) and len(queries) > 0:
                logger.info(f"AI planned queries for '{custom_prompt}': {queries}")
                return queries
        except Exception as e:
            logger.warning("Query planning failed, falling back to base theme: %s", e)
            
        return [theme]
    


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
        include_ar: bool = False,
        include_compass: bool = False,
        request=None,
        progress_callback=None,
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

        def _emit(label):
            if progress_callback:
                try:
                    progress_callback(label)
                except Exception as e:
                    logger.warning("progress_callback failed: %s", e)

        _emit(f"Exploring {city} for the perfect spots…")
        num_steps = max(3, duration // 15)
        location_query = self._format_location(city, country)
        candidate_places = self._discover_places(
            location_query, theme, num_steps, custom_prompt
        )
        candidate_places = self._cluster_candidates(
            candidate_places, keep=max(num_steps * 3, 12)
        )

        if not candidate_places:
            raise ValueError(
                f"Could not find any real places for theme '{theme}' in "
                f"'{location_query}'. Please try a different city or theme."
            )

        # ---- Step 2: Build RAG prompt with verified places ----
        ar_models = self._load_ar_catalog() if include_ar else []
        prompt = self._build_prompt(
            location_query,
            theme,
            mode,
            duration,
            language,
            custom_prompt,
            candidate_places,
            num_steps,
            ar_models,
            include_compass=include_compass,
        )

        _emit("Weaving your story together…")
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

        _emit("Your adventure is almost ready…")
        # ---- Step 5: Persist to database ----
        canonical_country, canonical_country_code = normalize_tour_country(
            country=country,
            country_code=country_code,
        )
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
                country=canonical_country,
                country_code=canonical_country_code,
                cover_image_attribution=cover_image_attribution,
                is_ai_generated=True,
                status=Tour.ARCHIVED,
                generation_source=Tour.AI,
            )
            if cover_image_bytes:
                filename = f"ai_tour_cover_{uuid.uuid4().hex}{cover_image_ext}"
                tour.cover_image.save(
                    filename,
                    ContentFile(cover_image_bytes),
                    save=False,
                )
                tour.save(update_fields=["cover_image"])

            ar_lookup = {m.id: m for m in ar_models}
            for idx, step_data in enumerate(tour_data["steps"], start=1):
                step = TourStep.objects.create(
                    tour=tour,
                    order=idx,
                    title=step_data["title"],
                    description=step_data.get("description", ""),
                    latitude=step_data["latitude"],
                    longitude=step_data["longitude"],
                )

                ar_data = step_data.get("ar") if include_ar else None
                resolved_ar = (
                    self._resolve_ar_puzzle(ar_data, ar_lookup) if ar_data else None
                )

                if resolved_ar:
                    self._create_ar_puzzle(step, resolved_ar, request=request)
                    continue

                puzzle_data = step_data.get("puzzle")

                # If the AI emitted neither a usable AR block nor a puzzle, but
                # the user asked for AR + we have a catalog, synthesize an AR
                # puzzle so PUZZLE mode never silently falls back to the lame
                # "What is the name of this location?" trivia.
                if include_ar and ar_models and not puzzle_data and mode == "PUZZLE":
                    synthesized = self._synthesize_ar_puzzle(
                        ar_models, step_data["title"]
                    )
                    if synthesized:
                        self._create_ar_puzzle(step, synthesized, request=request)
                        continue

                # Create puzzle if present (for PUZZLE and HYBRID modes)
                puzzle_created = False
                if puzzle_data:
                    puzzle_created = self._create_puzzle_from_ai(
                        step=step,
                        step_data=step_data,
                        puzzle_data=puzzle_data,
                        candidate_places=candidate_places,
                        include_compass=include_compass,
                    )
                if not puzzle_created and mode in ("PUZZLE", "HYBRID"):
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
                        xp_reward=Puzzle.fixed_xp_reward_for_type(Puzzle.TRIVIA),
                    )
                    TriviaPuzzleDetail.objects.update_or_create(
                        puzzle=puzzle,
                        defaults={
                            "options": puzzle.options or [],
                            "correct_answer": puzzle.correct_answer,
                        },
                    )

        # ---- Step 6: Calculate real-world metrics (background) ----
        # Directions + Elevation API calls add 1–3s and aren't required for
        # the response. Run them in a background thread so the user gets
        # their tour immediately; metrics get filled in shortly after.
        self._spawn_metrics_calculation(tour.pk)

        return tour

    def _spawn_metrics_calculation(self, tour_pk: int) -> None:
        def _run():
            try:
                tour = Tour.objects.get(pk=tour_pk)
                self._calculate_metrics(tour)
            except Exception as e:
                logger.warning(
                    "Background metrics calculation failed for tour %s: %s",
                    tour_pk,
                    e,
                )
            finally:
                connection.close()

        threading.Thread(
            target=_run, name=f"tour-metrics-{tour_pk}", daemon=True
        ).start()

    @staticmethod
    def _normalize_ai_puzzle_data(step_data: dict, puzzle_data: dict) -> dict:
        """Coerce Gemini puzzle output into a supported regular puzzle shape."""
        title = step_data.get("title", "this location")
        question = puzzle_data.get("question") or f"What is the name of {title}?"
        answer = puzzle_data.get("answer") or puzzle_data.get("correct_answer") or title
        options = puzzle_data.get("options")
        raw_type = str(puzzle_data.get("type", "")).strip().upper().replace("-", "_")

        if not isinstance(options, list):
            options = []

        options = [
            GeminiService._clean_trivia_option(option)
            for option in options
            if str(option).strip()
        ]
        options = [option for option in options if option]
        answer = GeminiService._clean_trivia_option(answer) or title
        question = GeminiService._clean_trivia_question(question)

        wants_open_ended = raw_type in {
            "OPEN_ENDED",
            "OPEN_ENDED_TEXT",
            "FREE_TEXT",
            "TEXT",
            "RIDDLE",
            "SHORT_ANSWER",
        }
        has_usable_trivia = len(options) >= 2
        puzzle_type = (
            Puzzle.OPEN_ENDED
            if wants_open_ended or not has_usable_trivia
            else Puzzle.TRIVIA
        )

        if puzzle_type == Puzzle.OPEN_ENDED:
            return {
                **puzzle_data,
                "type": Puzzle.OPEN_ENDED,
                "question": question,
                "options": None,
                "answer": answer,
                "hint": puzzle_data.get("hint", ""),
                "xp": puzzle_data.get("xp", 25),
            }

        if answer not in options:
            options.insert(0, answer)

        fallback_options = ["Unknown Place", "Central Park", "The Grand Palace"]
        for option in fallback_options:
            if len(options) >= 4:
                break
            if option != answer and option not in options:
                options.append(option)

        return {
            **puzzle_data,
            "type": Puzzle.TRIVIA,
            "question": question,
            "options": options[:4],
            "answer": answer,
            "hint": puzzle_data.get("hint", ""),
            "xp": puzzle_data.get("xp", 25),
        }

    @staticmethod
    def _clean_trivia_question(question: object) -> str:
        """Remove AI-inlined multiple-choice labels from a trivia question."""
        text = str(question).strip()
        matches = list(TRIVIA_OPTION_LABEL_REGEX.finditer(text))
        if len(matches) >= 2:
            text = text[: matches[0].start()].strip()
        return text

    @staticmethod
    def _clean_trivia_option(option: object) -> str:
        """Remove leading option labels such as A), B., or C: from answers."""
        return TRIVIA_OPTION_PREFIX_REGEX.sub("", str(option)).strip()

    # ------------------------------------------------------------------
    # Place Discovery (RAG — Retrieval Step)
    # ------------------------------------------------------------------

    @staticmethod
    def _format_location(city: str, country: str = "") -> str:
        return ", ".join(part for part in (city, country) if part)

    def _discover_places(
        self, city: str, theme: str, num_steps: int, custom_prompt: str = ""
    ) -> list[dict]:
        """
        Retrieve real, verified places from Google Maps using AI-planned queries.
        """
        maps_facade = GoogleMapsFacade()
        max_candidates = min(20, max(num_steps * 3, 15))
        all_candidates = []
        
        # Ask AI to generate search terms based on the user's custom prompt
        search_queries = self._plan_search_queries(city, theme, custom_prompt)
        
        # Search Maps for each query
        results_per_query = max_candidates // len(search_queries[:2])
        for query in search_queries[:2]:
            places = maps_facade.search_places(
                city=city, theme=query, max_results=results_per_query
            )
            all_candidates.extend(places)
            
        # Filter out duplicate places based on name
        unique_places = {p["name"]: p for p in all_candidates}.values()
        
        return list(unique_places)

    OUTLIER_MULTIPLIER = 2.5
    MIN_CANDIDATES_AFTER_TRIM = 4

    @staticmethod
    def _bearing_degrees(lat1: float, lng1: float, lat2: float, lng2: float) -> int:
        """Initial compass bearing from point 1 to point 2, normalized to [0, 359]."""
        lat1_r = math.radians(lat1)
        lat2_r = math.radians(lat2)
        dlng_r = math.radians(lng2 - lng1)
        x = math.sin(dlng_r) * math.cos(lat2_r)
        y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(
            lat2_r
        ) * math.cos(dlng_r)
        bearing = math.degrees(math.atan2(x, y))
        return int(round((bearing + 360) % 360)) % 360

    def _resolve_compass_heading(
        self,
        step_data: dict,
        puzzle_data: dict,
        candidate_places: list[dict],
    ) -> Optional[int]:
        """
        Determine a 0-359 target heading for a COMPASS puzzle.

        Preference order:
          1. ``target_landmark`` resolves to a verified place — compute the
             real bearing from the step's coordinates to that landmark.
          2. ``target_heading_degrees`` (or legacy ``answer``) is an int in
             [0, 359].
        Returns None if neither is usable.
        """
        landmark_name = puzzle_data.get("target_landmark")
        if isinstance(landmark_name, str) and landmark_name.strip():
            match = self._fuzzy_match_place(landmark_name, candidate_places)
            if match and (
                float(match["latitude"]) != float(step_data["latitude"])
                or float(match["longitude"]) != float(step_data["longitude"])
            ):
                return self._bearing_degrees(
                    float(step_data["latitude"]),
                    float(step_data["longitude"]),
                    float(match["latitude"]),
                    float(match["longitude"]),
                )

        raw = puzzle_data.get("target_heading_degrees")
        if raw is None:
            raw = puzzle_data.get("answer")
        try:
            heading = int(round(float(raw)))
        except (TypeError, ValueError):
            return None
        heading %= 360
        return heading if 0 <= heading <= 359 else None

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
    # Puzzle persistence
    # ------------------------------------------------------------------

    SUPPORTED_AI_PUZZLE_TYPES = (Puzzle.TRIVIA, Puzzle.OPEN_ENDED, Puzzle.COMPASS)

    def _create_puzzle_from_ai(
        self,
        *,
        step: TourStep,
        step_data: dict,
        puzzle_data: dict,
        candidate_places: list[dict],
        include_compass: bool = False,
    ) -> bool:
        """
        Persist a Puzzle (and its type-specific detail) from an AI payload.

        Returns True on success, False if the payload is unusable so the
        caller can fall back to the default trivia puzzle.
        """
        puzzle_type = (
            str(puzzle_data.get("type", "TRIVIA")).strip().upper().replace("-", "_")
        )
        if puzzle_type not in self.SUPPORTED_AI_PUZZLE_TYPES:
            puzzle_type = Puzzle.TRIVIA
        if puzzle_type == Puzzle.COMPASS and not include_compass:
            # Compass puzzles weren't requested — degrade to trivia and let the
            # caller's fallback logic produce a valid puzzle if needed.
            return False

        question = puzzle_data.get("question")
        if not question:
            return False

        if puzzle_type == Puzzle.COMPASS:
            heading = self._resolve_compass_heading(
                step_data, puzzle_data, candidate_places
            )
            if heading is None:
                logger.warning(
                    "AI returned an unusable COMPASS puzzle for step '%s'; "
                    "falling back.",
                    step_data.get("title"),
                )
                return False

            puzzle = Puzzle.objects.create(
                step=step,
                puzzle_type=Puzzle.COMPASS,
                question=question,
                options=None,
                correct_answer=str(heading),
                hint=puzzle_data.get("hint", ""),
                xp_reward=Puzzle.fixed_xp_reward_for_type(Puzzle.COMPASS),
            )
            CompassPuzzleDetail.objects.create(
                puzzle=puzzle,
                target_heading_degrees=heading,
            )
            return True

        puzzle_data = self._normalize_ai_puzzle_data(step_data, puzzle_data)
        puzzle_type = puzzle_data["type"]
        answer = puzzle_data.get("answer")
        options = puzzle_data.get("options")
        if not answer:
            return False

        if puzzle_type == Puzzle.OPEN_ENDED:
            Puzzle.objects.create(
                step=step,
                puzzle_type=Puzzle.OPEN_ENDED,
                question=puzzle_data["question"],
                options=None,
                correct_answer=answer,
                hint=puzzle_data.get("hint", ""),
                xp_reward=Puzzle.fixed_xp_reward_for_type(Puzzle.OPEN_ENDED),
            )
            return True

        if not isinstance(options, list) or len(options) < 2:
            return False

        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.TRIVIA,
            question=puzzle_data["question"],
            options=options,
            correct_answer=answer,
            hint=puzzle_data.get("hint", ""),
            xp_reward=Puzzle.fixed_xp_reward_for_type(Puzzle.TRIVIA),
        )
        TriviaPuzzleDetail.objects.update_or_create(
            puzzle=puzzle,
            defaults={
                "options": options,
                "correct_answer": answer,
            },
        )
        return True

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
        ar_models: list[ARModel] | None = None,
        include_compass: bool = False,
    ) -> str:
        """
        Build a RAG prompt that constrains Gemini to select from verified
        Google Maps places.
        """
        puzzle_kinds = ["TRIVIA", "OPEN_ENDED"]
        if ar_models:
            puzzle_kinds.append("AR")
        if include_compass:
            puzzle_kinds.append("COMPASS")
        kinds_phrase = (
            puzzle_kinds[0]
            if len(puzzle_kinds) == 1
            else ", ".join(puzzle_kinds[:-1]) + ", or " + puzzle_kinds[-1]
        )

        mode_instructions = {
            "STORY": "Focus on rich narrative storytelling. Each step should have detailed historical or thematic descriptions that immerse the user in the story. No puzzles needed.",
            "PUZZLE": f"Focus on interactive challenges, but every step still needs a short story/narrative description before the puzzle. Each step MUST have a puzzle ({kinds_phrase}). Mix multiple-choice trivia with open-ended riddles whose answers are limited to 1-2 words.",
            "HYBRID": f"Balance storytelling with puzzles. Each step should have both a narrative description AND a puzzle challenge. Use a mix of {kinds_phrase} puzzles.",
        }

        trivia_schema = """
        TRIVIA — multiple-choice question grounded in the location's history,
        architecture, or culture:
        "puzzle": {
            "type": "TRIVIA",
            "question": "What year was this building constructed?",
            "options": ["1850", "1875", "1900", "1925"],
            "answer": "1875",
            "hint": "It was built during the Victorian era",
            "xp": 25
        }

        OR

        "puzzle": {
            "type": "OPEN_ENDED",
            "question": "I have watched empires rise beneath one dome. What landmark am I?",
            "answer": "Hagia Sophia",
            "hint": "Its Turkish name is Ayasofya",
            "xp": 25
        }"""

        compass_schema = """
        COMPASS — asks the user to physically face a direction. The phone
        vibrates as they rotate toward the target heading. STRONGLY PREFER
        specifying "target_landmark" with the EXACT name of another stop from
        the VERIFIED LOCATIONS list — the backend will compute the real
        bearing from this step to that landmark. Only fall back to a raw
        "target_heading_degrees" integer (0-359, 0=N, 90=E, 180=S, 270=W)
        when no nearby landmark fits the question:
        "puzzle": {
            "type": "COMPASS",
            "question": "Face the direction of the Blue Mosque from where you stand.",
            "target_landmark": "Blue Mosque",
            "hint": "Its silhouette is visible across the square.",
            "xp": 25
        }"""

        if include_compass:
            puzzle_schema = (
                "\n        Each puzzle is one of three regular types: TRIVIA, "
                "OPEN_ENDED, or COMPASS. "
                "Pick whichever fits the location best; mix the types across the "
                "tour so it does not feel repetitive (aim for at least one "
                "COMPASS puzzle when there are 3+ steps).\n"
                + trivia_schema
                + "\n"
                + compass_schema
            )
        else:
            puzzle_schema = trivia_schema

        puzzle_field = '"puzzle": {...}' if mode in ["PUZZLE", "HYBRID"] else ""
        puzzle_instruction = (
            "Puzzle schema for each step:" + puzzle_schema
            if mode in ["PUZZLE", "HYBRID"]
            else ""
        )
        supported_regular_types = (
            "TRIVIA, OPEN_ENDED, or COMPASS"
            if include_compass
            else "TRIVIA or OPEN_ENDED"
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
            f'  {i}. "{p["name"]}" — GPS: ({p["latitude"]}, {p["longitude"]})'
            + (f" — {p['address']}" if p.get("address") else "")
            + _area_label(p)
            for i, p in enumerate(candidate_places, start=1)
        )

        ar_section = self._build_ar_prompt_section(ar_models or [], mode)

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
6. For trivia puzzles, keep the question text separate from the choices. Do NOT put answer choices or labels like "A)", "B)", "C)", or "D)" inside the "question" field. Put choices only in the "options" array, without letter prefixes.
7. For PUZZLE and HYBRID modes, every step must include both a non-empty "description" story and a "puzzle" challenge in the same step.
8. Regular puzzle "type" must be {supported_regular_types}. For OPEN_ENDED, do not include an "options" array. The "answer" MUST be exactly one word or two words maximum, short and canonical, with no punctuation and no full sentences.

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
            "longitude": 2.2945{", " + puzzle_field if puzzle_field else ""}
        }}
    ]
}}

{puzzle_instruction}
{ar_section}
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
            "Failed to parse AI response as JSON. The model did not return valid JSON."
        )

    # ------------------------------------------------------------------
    # AR support
    # ------------------------------------------------------------------

    @staticmethod
    def _load_ar_catalog() -> list[ARModel]:
        return [
            m
            for m in ARModel.objects.filter(is_active=True).order_by("sort_order", "id")
            if isinstance(m.anchors, list) and m.anchors
        ]

    @staticmethod
    def _build_ar_prompt_section(ar_models: list[ARModel], mode: str) -> str:
        if not ar_models:
            return ""

        lines = []
        for m in ar_models:
            anchor_descriptors = ", ".join(
                f'"{a.get("id")}"' + (f" ({a.get('label')})" if a.get("label") else "")
                for a in m.anchors
                if isinstance(a, dict) and a.get("id")
            )
            lines.append(
                f'  - model_id={m.id}, name="{m.name}", anchors=[{anchor_descriptors}]'
            )
        catalog = "\n".join(lines)

        if mode == "PUZZLE":
            usage_rule = (
                "Every step MUST have either a regular `puzzle` OR an `ar` block — "
                "never neither. Prefer `ar` for at least HALF of the steps; pick "
                "the AR model whose theme/shape fits the stop best."
            )
        elif mode == "HYBRID":
            usage_rule = (
                "Add an `ar` block on the steps where an AR model thematically "
                "fits the location. Aim for roughly 1 AR step per 3 stops; the "
                "rest keep their regular `puzzle`."
            )
        else:  # STORY
            usage_rule = (
                "On at most 1-2 thematically perfect stops you MAY attach an "
                "`ar` block as a bonus interactive moment. Skip AR otherwise."
            )

        return f"""
═══════════════════════════════════════════════════════════════
AR PUZZLES (augmented-reality 3D models available for this tour):
═══════════════════════════════════════════════════════════════
{catalog}

{usage_rule}

AR object schema:
  "ar": {{
      "model_id": <int from the list above>,
      "anchor_id": "<one of that model's anchor ids>",
      "secret_code": "<4-12 letters/digits, themed to the location, e.g. ATHENA1>",
      "model_scale_meters": <number between 0.3 and 10.0>,
      "question": "Find the AR <model name> near this spot and enter the secret code.",
      "hint": "<short hint where to look>",
      "xp": 30
  }}

CRITICAL AR RULES:
- The secret_code MUST be 4-12 alphanumeric characters only (A-Z, a-z, 0-9). No spaces, no punctuation, no accents.
- model_id MUST be one of the integer ids listed above; anchor_id MUST belong to that model.
- A step can have EITHER "puzzle" OR "ar", not both. AR replaces the regular puzzle for that step.
"""

    @staticmethod
    def _sanitize_secret_code(raw) -> str:
        cleaned = re.sub(r"[^A-Za-z0-9]", "", str(raw or ""))[:12]
        if len(cleaned) < 4:
            pad = "".join(
                random.choices(
                    string.ascii_uppercase + string.digits, k=4 - len(cleaned)
                )
            )
            cleaned = (cleaned + pad)[:12]
        return cleaned

    def _resolve_ar_puzzle(
        self, ar_data: dict, ar_lookup: dict[int, ARModel]
    ) -> Optional[dict]:
        """Validate AI-generated AR data against the catalog.

        Returns a normalized dict ready for persistence, or None if the AI
        picked a model/anchor that doesn't exist (in which case we silently
        skip AR on that step rather than failing the whole tour).
        """
        if not isinstance(ar_data, dict):
            return None

        try:
            model_id = int(ar_data.get("model_id"))
        except (TypeError, ValueError):
            logger.info("AI returned AR block with invalid model_id: %r", ar_data)
            return None

        ar_model = ar_lookup.get(model_id)
        if ar_model is None:
            logger.info(
                "AI returned AR block referencing unknown model_id=%s "
                "(catalog ids: %s)",
                model_id,
                list(ar_lookup.keys()),
            )
            return None

        anchor_id = str(ar_data.get("anchor_id") or "").strip()
        anchor = next(
            (
                a
                for a in ar_model.anchors
                if isinstance(a, dict) and str(a.get("id")) == anchor_id
            ),
            None,
        )
        if anchor is None:
            logger.info(
                "AI returned AR block with anchor_id=%r not present on model_id=%s",
                anchor_id,
                model_id,
            )
            return None

        try:
            scale = float(ar_data.get("model_scale_meters", AR_DEFAULT_SCALE))
        except (TypeError, ValueError):
            scale = AR_DEFAULT_SCALE
        scale = min(max(scale, AR_MIN_SCALE), AR_MAX_SCALE)

        position = anchor.get("position") if isinstance(anchor, dict) else {}
        if not isinstance(position, dict):
            position = {}

        return {
            "ar_model": ar_model,
            "anchor_id": anchor_id,
            "secret_code": self._sanitize_secret_code(ar_data.get("secret_code")),
            "model_scale_meters": scale,
            "question": ar_data.get("question")
            or f"Find the AR {ar_model.name} near this spot and enter the secret code.",
            "hint": ar_data.get("hint", ""),
            "xp_reward": int(ar_data.get("xp", 30) or 30),
            "anchor_position": {
                "x": float(position.get("x", 0.0)),
                "y": float(position.get("y", 0.0)),
                "z": float(position.get("z", 0.0)),
            },
        }

    @classmethod
    def _synthesize_ar_puzzle(
        cls, ar_models: list[ARModel], step_title: str
    ) -> Optional[dict]:
        """Build an AR puzzle from scratch when the AI fails to emit a valid one.

        Picks a random model + first valid anchor and a random secret code so
        every step in PUZZLE+include_ar mode ends up with an actual AR puzzle
        instead of the generic 'name of this location' trivia.
        """
        ar_model = random.choice(ar_models)
        anchor = next(
            (a for a in ar_model.anchors if isinstance(a, dict) and a.get("id")),
            None,
        )
        if anchor is None:
            return None

        position = anchor.get("position") if isinstance(anchor, dict) else {}
        if not isinstance(position, dict):
            position = {}

        logger.info(
            "Synthesizing AR puzzle for step '%s' with model_id=%s anchor_id=%s",
            step_title,
            ar_model.id,
            anchor.get("id"),
        )

        return {
            "ar_model": ar_model,
            "anchor_id": str(anchor.get("id")),
            "secret_code": cls._sanitize_secret_code(""),
            "model_scale_meters": AR_DEFAULT_SCALE,
            "question": (
                f"Find the AR {ar_model.name} near {step_title} and enter the "
                "secret code."
            ),
            "hint": f"Look around for the {ar_model.name}.",
            "xp_reward": 30,
            "anchor_position": {
                "x": float(position.get("x", 0.0)),
                "y": float(position.get("y", 0.0)),
                "z": float(position.get("z", 0.0)),
            },
        }

    @staticmethod
    def _create_ar_puzzle(step: TourStep, resolved: dict, request=None) -> None:
        ar_model: ARModel = resolved["ar_model"]
        puzzle = Puzzle.objects.create(
            step=step,
            puzzle_type=Puzzle.AR,
            question=resolved["question"],
            options=None,
            correct_answer="",
            hint=resolved["hint"],
            xp_reward=resolved["xp_reward"],
        )
        ArPuzzleDetail.objects.create(
            puzzle=puzzle,
            scene_asset_url=ar_model.get_scene_asset_url(request=request),
            metadata={
                "version": 1,
                "model_id": ar_model.id,
                "anchor_id": resolved["anchor_id"],
                "placement_mode": "anchor",
                "secret_code": resolved["secret_code"],
                "model_scale_meters": resolved["model_scale_meters"],
                "anchor_position": resolved["anchor_position"],
            },
        )
