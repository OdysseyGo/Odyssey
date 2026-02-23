"""
Unit tests for GeminiService.

All external dependencies (Gemini API, Google Maps) are mocked so
these tests can run without API keys or network access.
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from django.test import TestCase

from apps.tours.models import Puzzle, Tour, TourStep

from .services import GeminiService

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _valid_tour_json(*, include_puzzles: bool = True) -> dict:
    """Return a well-formed tour data dict that mirrors what the AI returns."""
    step_base = {
        "title": "Hagia Sophia",
        "description": "A masterpiece of Byzantine architecture.",
        "latitude": 41.00858,
        "longitude": 28.98018,
    }
    step_2 = {
        "title": "Blue Mosque",
        "description": "The iconic Sultan Ahmed Mosque.",
        "latitude": 41.00542,
        "longitude": 28.97680,
    }

    if include_puzzles:
        step_base["puzzle"] = {
            "type": "TRIVIA",
            "question": "When was it built?",
            "options": ["537 AD", "1453 AD", "1935 AD", "325 AD"],
            "answer": "537 AD",
            "hint": "Commissioned by Justinian I.",
            "xp": 20,
        }
        step_2["puzzle"] = {
            "type": "TRIVIA",
            "question": "How many minarets?",
            "options": ["4", "5", "6", "7"],
            "answer": "6",
            "hint": "Unique among mosques.",
            "xp": 15,
        }

    return {
        "title": "Historic Istanbul Walking Tour",
        "description": "Explore Istanbul.",
        "difficulty": "MEDIUM",
        "steps": [step_base, step_2],
    }


def _mock_gemini_response(tour_data: dict) -> MagicMock:
    """Create a mock Gemini response from a dict."""
    resp = MagicMock()
    resp.text = json.dumps(tour_data)
    return resp


@pytest.fixture(autouse=True)
def _patch_genai():
    """Globally patch google.generativeai for all tests."""
    with patch("apps.ai_content.services.genai") as mock_genai:
        mock_model = MagicMock()
        mock_genai.GenerativeModel.return_value = mock_model
        yield mock_model


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGenerateTour(TestCase):
    """Tests for GeminiService.generate_tour"""

    def _make_creator(self):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        return User.objects.create_user(
            username="test_creator",
            password="pass123",
            email="creator@test.com",
        )

    # ---- Fix 1: Valid tour creates all objects ----------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_valid_response_creates_tour_steps_puzzles(self, mock_genai, mock_maps_cls):
        """A well-formed AI response should create Tour + Steps + Puzzles."""
        tour_data = _valid_tour_json(include_puzzles=True)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_maps_cls.return_value.calculate_route_metrics.return_value = {
            "success": False
        }

        creator = self._make_creator()
        service = GeminiService()
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="PUZZLE",
            duration=60,
            language="en",
            creator=creator,
        )

        assert tour.title == "Historic Istanbul Walking Tour"
        assert tour.steps.count() == 2
        assert Puzzle.objects.filter(step__tour=tour).count() == 2

    # ---- Fix 2: Atomic rollback ------------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_atomic_rollback_on_step_failure(self, mock_genai, mock_maps_cls):
        """If step creation fails mid-way, no Tour row should remain."""
        tour_data = _valid_tour_json(include_puzzles=False)
        # Inject an invalid step (missing latitude) to trigger a DB error
        tour_data["steps"].append(
            {"title": "Bad Step", "description": "No coords", "longitude": 28.0}
        )

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        creator = self._make_creator()
        service = GeminiService()

        # The validation step should catch the missing latitude
        with pytest.raises(ValueError, match="missing required key 'latitude'"):
            service.generate_tour(
                city="Istanbul",
                theme="History",
                mode="STORY",
                duration=60,
                language="en",
                creator=creator,
            )

        assert Tour.objects.count() == 0
        assert TourStep.objects.count() == 0

    # ---- Fix 3: Missing key validation -----------------------------------

    @patch("apps.ai_content.services.genai")
    def test_missing_title_raises_value_error(self, mock_genai):
        """Response missing 'title' should raise ValueError before DB writes."""
        tour_data = {"description": "A tour", "steps": []}

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        creator = self._make_creator()
        service = GeminiService()

        with pytest.raises(ValueError, match="missing required keys.*title"):
            service.generate_tour(
                city="Paris",
                theme="Art",
                mode="STORY",
                duration=60,
                language="en",
                creator=creator,
            )

    @patch("apps.ai_content.services.genai")
    def test_empty_steps_raises_value_error(self, mock_genai):
        """An empty steps list should raise ValueError."""
        tour_data = {"title": "Tour", "description": "Desc", "steps": []}

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        creator = self._make_creator()
        service = GeminiService()

        with pytest.raises(ValueError, match="non-empty list"):
            service.generate_tour(
                city="Paris",
                theme="Art",
                mode="STORY",
                duration=60,
                language="en",
                creator=creator,
            )

    # ---- Fix 4: Puzzle fallback ------------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_puzzle_fallback_in_puzzle_mode(self, mock_genai, mock_maps_cls):
        """In PUZZLE mode, missing puzzle data should generate a fallback."""
        tour_data = _valid_tour_json(include_puzzles=False)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_maps_cls.return_value.calculate_route_metrics.return_value = {
            "success": False
        }

        creator = self._make_creator()
        service = GeminiService()
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="PUZZLE",
            duration=60,
            language="en",
            creator=creator,
        )

        puzzles = Puzzle.objects.filter(step__tour=tour)
        assert puzzles.count() == 2
        # Fallback puzzles ask "What is the name of this location?"
        assert all("name of this location" in p.question for p in puzzles)

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_no_fallback_in_story_mode(self, mock_genai, mock_maps_cls):
        """In STORY mode, missing puzzle data should NOT create puzzles."""
        tour_data = _valid_tour_json(include_puzzles=False)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_maps_cls.return_value.calculate_route_metrics.return_value = {
            "success": False
        }

        creator = self._make_creator()
        service = GeminiService()
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=60,
            language="en",
            creator=creator,
        )

        assert Puzzle.objects.filter(step__tour=tour).count() == 0

    # ---- Fix 5: Duration calculation -------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_duration_includes_exploration_time(self, mock_genai, mock_maps_cls):
        """Duration should be walking_time + (num_steps * MINUTES_PER_STEP)."""
        tour_data = _valid_tour_json(include_puzzles=False)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.calculate_route_metrics.return_value = {
            "success": True,
            "total_distance": 2000.0,
            "walking_distance": 2000.0,
            "elevation_gain": 10.0,
            "max_leg_distance": 1000.0,
            "requires_transport": False,
            "is_circular": False,
            "duration_minutes": 30,  # 30 min walking
        }
        mock_facade.estimate_accessibility.return_value = 7

        creator = self._make_creator()
        service = GeminiService()
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=60,
            language="en",
            creator=creator,
        )

        # 30 min walking + 2 steps * 5 min = 40 min total
        assert tour.duration_minutes == 40


# ---------------------------------------------------------------------------
# Parsing Tests
# ---------------------------------------------------------------------------


class TestParseResponse(TestCase):
    """Tests for GeminiService._parse_response"""

    def _service(self):
        with patch("apps.ai_content.services.genai"):
            return GeminiService()

    def test_plain_json(self):
        data = {"title": "Tour"}
        result = self._service()._parse_response(json.dumps(data))
        assert result == data

    def test_markdown_fenced_json(self):
        data = {"title": "Tour"}
        raw = f"```json\n{json.dumps(data)}\n```"
        result = self._service()._parse_response(raw)
        assert result == data

    def test_prose_before_json(self):
        data = {"title": "Tour", "description": "Desc", "steps": []}
        raw = f"Here is your tour:\n{json.dumps(data)}"
        result = self._service()._parse_response(raw)
        assert result == data

    def test_invalid_json_raises_value_error(self):
        with pytest.raises(ValueError, match="Failed to parse"):
            self._service()._parse_response("This is not JSON at all")
