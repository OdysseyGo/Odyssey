import logging
import os
from typing import Optional

from django.db import transaction

from apps.tours.models import Puzzle, Tour, TourStep, TriviaPuzzleDetail
from apps.tours.utils import GoogleMapsFacade

from .providers import GeminiProvider, TourLLMProvider, load_provider_chain

logger = logging.getLogger(__name__)


class TourGenerationService:
    """
    RAG-based tour generation with pluggable LLM providers.

    Architecture (Maps First, AI Second):
        1. Query Google Maps Places API for real places matching the theme/city.
        2. Feed verified places into the prompt so the LLM can only
           select from real, coordinate-verified locations.
        3. LLM writes creative content (stories, puzzles) for selected places.
    """

    MINUTES_PER_STEP = 5

    def __init__(
        self,
        providers: Optional[list[TourLLMProvider]] = None,
    ):
        self.providers = providers if providers is not None else load_provider_chain()
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "3"))

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
        num_steps = max(3, duration // 15)
        location_query = self._format_location(city, country)
        candidate_places = self._discover_places(location_query, theme, num_steps)

        if not candidate_places:
            raise ValueError(
                f"Could not find any real places for theme '{theme}' in "
                f"'{location_query}'. Please try a different city or theme."
            )

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

        tour_data = self._generate_with_fallback(prompt=prompt, mode=mode)

        self._validate_tour_data(tour_data, mode)

        places_lookup = {p["name"].strip().lower(): p for p in candidate_places}

        for step_data in tour_data["steps"]:
            step_name = step_data["title"].strip().lower()
            matched_place = places_lookup.get(step_name)

            if matched_place:
                step_data["latitude"] = matched_place["latitude"]
                step_data["longitude"] = matched_place["longitude"]
            else:
                matched_place = self._fuzzy_match_place(
                    step_data["title"], candidate_places
                )
                if matched_place:
                    step_data["latitude"] = matched_place["latitude"]
                    step_data["longitude"] = matched_place["longitude"]
                else:
                    logger.warning(
                        "AI selected '%s' which was not in the candidate list. "
                        "Falling back to geocoding.",
                        step_data["title"],
                    )
                    maps_facade = GoogleMapsFacade()
                    verified_lat, verified_lng = maps_facade.geocode_location(
                        name=step_data["title"],
                        city=location_query,
                        fallback_lat=step_data.get("latitude", 0),
                        fallback_lng=step_data.get("longitude", 0),
                    )
                    step_data["latitude"] = verified_lat
                    step_data["longitude"] = verified_lng

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

        self._calculate_metrics(tour)

        return tour

    def _generate_with_fallback(self, prompt: str, mode: str) -> dict:
        errors: list[Exception] = []

        for provider_idx, provider in enumerate(self.providers):
            provider_name = provider.__class__.__name__

            for attempt in range(1, self.max_retries + 1):
                try:
                    logger.info(
                        "Generating tour with provider=%s attempt=%d/%d",
                        provider_name,
                        attempt,
                        self.max_retries,
                    )
                    return provider.generate_tour_data(prompt=prompt, mode=mode)
                except ValueError as exc:
                    errors.append(exc)
                    logger.warning(
                        "Provider=%s parse/validation failure attempt=%d/%d: %s",
                        provider_name,
                        attempt,
                        self.max_retries,
                        exc,
                    )
                except Exception as exc:
                    errors.append(exc)
                    logger.error(
                        "Provider=%s failed attempt=%d/%d: %s",
                        provider_name,
                        attempt,
                        self.max_retries,
                        exc,
                    )
                    break

            if provider_idx < len(self.providers) - 1:
                logger.warning(
                    "Switching AI provider from %s to next fallback", provider_name
                )

        raise ValueError(
            "AI failed to return a valid tour after retries and fallback attempts."
        ) from (errors[-1] if errors else None)

    @staticmethod
    def _format_location(city: str, country: str = "") -> str:
        return ", ".join(part for part in (city, country) if part)

    def _discover_places(self, city: str, theme: str, num_steps: int) -> list[dict]:
        maps_facade = GoogleMapsFacade()
        max_candidates = max(num_steps * 3, 15)
        return maps_facade.search_places(
            city=city, theme=theme, max_results=max_candidates
        )

    @staticmethod
    def _fuzzy_match_place(
        ai_name: str, candidates: list[dict], threshold: float = 0.6
    ) -> Optional[dict]:
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

    @staticmethod
    def _validate_tour_data(tour_data: dict, mode: str) -> None:
        del mode
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

    def _calculate_metrics(self, tour: Tour) -> None:
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
        except Exception as exc:
            logger.warning("Failed to calculate route metrics: %s", exc)

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
        mode_instructions = {
            "STORY": "Focus on rich narrative storytelling. Each step should have detailed historical or thematic descriptions that immerse the user in the story. No puzzles needed.",
            "PUZZLE": "Focus on interactive challenges. Each step MUST have a puzzle (trivia question, riddle, or observation task). Keep descriptions brief.",
            "HYBRID": "Balance storytelling with puzzles. Each step should have both a narrative description AND a puzzle challenge.",
        }

        user_instruction = (
            f"\nADDITIONAL USER INSTRUCTIONS: {custom_prompt}\n"
            if custom_prompt
            else ""
        )

        places_list = "\n".join(
            f'  {i}. "{p["name"]}" — GPS: ({p["latitude"]}, {p["longitude"]})'
            + (f' — {p["address"]}' if p.get("address") else "")
            for i, p in enumerate(candidate_places, start=1)
        )

        return f"""You are a tour guide AI. Generate a {mode} tour in {city} with the theme \"{theme}\".
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
6. Always include a \"puzzle\" field in every step. Use null for STORY mode.

Generate the tour now as strict JSON."""

    # Backward compatibility for legacy tests or callers.
    def _parse_response(self, response_text: str) -> dict:
        return GeminiProvider._parse_response(response_text)


# Backward-compatible alias; view import path can migrate gradually.
GeminiService = TourGenerationService
