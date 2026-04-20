"""
Unit tests for GeminiService (RAG pipeline).

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


def _candidate_places() -> list[dict]:
    """Return a list of verified Google Maps places (simulating search_places)."""
    return [
        {
            "name": "Hagia Sophia",
            "place_id": "ChIJy5olGKC5yhQRzmFRHOT2cYA",
            "latitude": 41.00860,
            "longitude": 28.98020,
            "address": "Sultan Ahmet, Ayasofya Meydanı No:1, Istanbul",
            "types": ["tourist_attraction", "museum"],
        },
        {
            "name": "Blue Mosque",
            "place_id": "ChIJ2V-ypMu5yhQRVL-Fs_5CfDw",
            "latitude": 41.00550,
            "longitude": 28.97690,
            "address": "Sultan Ahmet, At Meydanı No:7, Istanbul",
            "types": ["mosque", "tourist_attraction"],
        },
        {
            "name": "Topkapi Palace",
            "place_id": "ChIJGzD0K5S5yhQRMNUyNWJzGCw",
            "latitude": 41.01140,
            "longitude": 28.98330,
            "address": "Cankurtaran, Istanbul",
            "types": ["museum", "tourist_attraction"],
        },
        {
            "name": "Grand Bazaar",
            "place_id": "ChIJScTTAgm5yhQRH29LPQR5a6M",
            "latitude": 41.01070,
            "longitude": 28.96800,
            "address": "Beyazıt, Kalpakçılar Cd., Istanbul",
            "types": ["shopping_mall", "tourist_attraction"],
        },
        {
            "name": "Basilica Cistern",
            "place_id": "ChIJ6dFnXaC5yhQRAx4RNGlcYKY",
            "latitude": 41.00840,
            "longitude": 28.97790,
            "address": "Alemdar, Yerebatan Cd. 1/3, Istanbul",
            "types": ["tourist_attraction", "museum"],
        },
    ]


def _valid_tour_json(*, include_puzzles: bool = True) -> dict:
    """
    Return a well-formed tour data dict that mirrors what the AI returns
    when constrained to verified places.
    """
    step_base = {
        "title": "Hagia Sophia",
        "description": "A masterpiece of Byzantine architecture.",
        "latitude": 41.00860,
        "longitude": 28.98020,
    }
    step_2 = {
        "title": "Blue Mosque",
        "description": "The iconic Sultan Ahmed Mosque.",
        "latitude": 41.00550,
        "longitude": 28.97690,
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
# Tests — RAG Pipeline
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestGenerateTour(TestCase):
    """Tests for GeminiService.generate_tour (RAG pipeline)"""

    def _make_creator(self):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        return User.objects.create_user(
            username="test_creator",
            password="pass123",
            email="creator@test.com",
        )

    # ---- RAG pipeline: valid tour creates all objects --------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_valid_response_creates_tour_steps_puzzles(self, mock_genai, mock_maps_cls):
        """A well-formed AI response should create Tour + Steps + Puzzles."""
        tour_data = _valid_tour_json(include_puzzles=True)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        # Mock the maps facade for both search_places and calculate_route_metrics
        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

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

    # ---- RAG pipeline: verified coordinates are used ---------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_verified_coordinates_replace_ai_coords(self, mock_genai, mock_maps_cls):
        """Steps should use Google Maps verified coordinates, not AI guesses."""
        tour_data = _valid_tour_json(include_puzzles=False)
        # AI returns slightly wrong coordinates
        tour_data["steps"][0]["latitude"] = 41.0
        tour_data["steps"][0]["longitude"] = 29.0

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

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

        steps = list(tour.steps.order_by("order"))
        # Should use the verified coordinates from _candidate_places, NOT (41.0, 29.0)
        assert float(steps[0].latitude) == pytest.approx(41.00860, abs=1e-5)
        assert float(steps[0].longitude) == pytest.approx(28.98020, abs=1e-5)

    # ---- RAG pipeline: no places found raises ValueError -----------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_no_places_found_raises_value_error(self, mock_genai, mock_maps_cls):
        """When Google Maps returns no places, a clear error should be raised."""
        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = []

        creator = self._make_creator()
        service = GeminiService()

        with pytest.raises(ValueError, match="Could not find any real places"):
            service.generate_tour(
                city="Atlantis",
                theme="Underwater",
                mode="STORY",
                duration=60,
                language="en",
                creator=creator,
            )

    # ---- RAG pipeline: fuzzy matching works ------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_fuzzy_match_corrects_slightly_different_names(
        self, mock_genai, mock_maps_cls
    ):
        """AI returning a slightly different name should still match a candidate."""
        tour_data = _valid_tour_json(include_puzzles=False)
        # AI uses "Hagia Sophia Museum" instead of "Hagia Sophia"
        tour_data["steps"][0]["title"] = "Hagia Sophia Museum"
        tour_data["steps"][0]["latitude"] = 0
        tour_data["steps"][0]["longitude"] = 0

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

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

        steps = list(tour.steps.order_by("order"))
        # Should have matched "Hagia Sophia Museum" → "Hagia Sophia" via fuzzy match
        assert float(steps[0].latitude) == pytest.approx(41.00860, abs=1e-5)

    # ---- Atomic rollback -------------------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_atomic_rollback_on_step_failure(self, mock_genai, mock_maps_cls):
        """If step creation fails mid-way, no Tour row should remain."""
        tour_data = _valid_tour_json(include_puzzles=False)
        # Inject an invalid step (missing title) to trigger validation error
        tour_data["steps"].append(
            {"description": "No title here", "latitude": 41.0, "longitude": 28.0}
        )

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()

        creator = self._make_creator()
        service = GeminiService()

        with pytest.raises(ValueError, match="missing required key 'title'"):
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

    # ---- Missing key validation ------------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_missing_title_raises_value_error(self, mock_genai, mock_maps_cls):
        """Response missing 'title' should raise ValueError before DB writes."""
        tour_data = {"description": "A tour", "steps": []}

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()

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

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_empty_steps_raises_value_error(self, mock_genai, mock_maps_cls):
        """An empty steps list should raise ValueError."""
        tour_data = {"title": "Tour", "description": "Desc", "steps": []}

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()

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

    # ---- Puzzle fallback -------------------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_puzzle_fallback_in_puzzle_mode(self, mock_genai, mock_maps_cls):
        """In PUZZLE mode, missing puzzle data should generate a fallback."""
        tour_data = _valid_tour_json(include_puzzles=False)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

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
        assert all("name of this location" in p.question for p in puzzles)

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_no_fallback_in_story_mode(self, mock_genai, mock_maps_cls):
        """In STORY mode, missing puzzle data should NOT create puzzles."""
        tour_data = _valid_tour_json(include_puzzles=False)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

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

    # ---- Duration calculation --------------------------------------------

    @patch("apps.ai_content.services.GoogleMapsFacade")
    @patch("apps.ai_content.services.genai")
    def test_duration_includes_exploration_time(self, mock_genai, mock_maps_cls):
        """Duration should be walking_time + (num_steps * MINUTES_PER_STEP)."""
        tour_data = _valid_tour_json(include_puzzles=False)

        mock_model = MagicMock()
        mock_model.generate_content.return_value = _mock_gemini_response(tour_data)
        mock_genai.GenerativeModel.return_value = mock_model

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {
            "success": True,
            "total_distance": 2000.0,
            "walking_distance": 2000.0,
            "elevation_gain": 10.0,
            "max_leg_distance": 1000.0,
            "requires_transport": False,
            "is_circular": False,
            "duration_minutes": 30,
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
# Parsing Tests (unchanged — independent of RAG pipeline)
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


# ---------------------------------------------------------------------------
# Fuzzy Matching Tests
# ---------------------------------------------------------------------------


class TestFuzzyMatchPlace(TestCase):
    """Tests for GeminiService._fuzzy_match_place"""

    def test_exact_match(self):
        candidates = _candidate_places()
        result = GeminiService._fuzzy_match_place("Hagia Sophia", candidates)
        assert result is not None
        assert result["name"] == "Hagia Sophia"

    def test_partial_match(self):
        candidates = _candidate_places()
        result = GeminiService._fuzzy_match_place("Hagia Sophia Museum", candidates)
        assert result is not None
        assert result["name"] == "Hagia Sophia"

    def test_no_match(self):
        candidates = _candidate_places()
        result = GeminiService._fuzzy_match_place(
            "Completely Unknown Place", candidates
        )
        assert result is None

    def test_empty_name(self):
        candidates = _candidate_places()
        result = GeminiService._fuzzy_match_place("", candidates)
        assert result is None


# ---------------------------------------------------------------------------
# AI Generation Quota Tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAIGenerationQuotaService(TestCase):
    """Service-level tests for AI generation quota handling in CreditService."""

    def _make_user(self, user_type=1):
        from django.contrib.auth import get_user_model

        User = get_user_model()
        return User.objects.create_user(
            username=f"user_{user_type}_{id(self)}",
            password="pass123",
            email=f"user_{id(self)}@test.com",
            user_type=user_type,
        )

    def test_free_user_blocked_after_limit(self):
        """Free user exceeding 3 AI generations/month should report used >= limit."""
        from apps.payments.services.credit_service import CreditService

        user = self._make_user(user_type=1)
        # Simulate 3 generations already used
        user.ai_generations_this_month = 3
        import datetime

        user.ai_generation_reset_date = datetime.date.today()
        user.save()

        allowance = CreditService.get_ai_generation_allowance(user)
        assert not allowance["unlimited"]
        assert allowance["used"] >= allowance["limit"]

    def test_free_user_allowed_within_limit(self):
        """Free user with fewer than 3 generations should be allowed."""
        from apps.payments.services.credit_service import CreditService

        user = self._make_user(user_type=1)
        user.ai_generations_this_month = 1
        import datetime

        user.ai_generation_reset_date = datetime.date.today()
        user.save()

        allowance = CreditService.get_ai_generation_allowance(user)
        assert not allowance["unlimited"]
        assert allowance["used"] < allowance["limit"]

    def test_premium_user_has_unlimited_generations(self):
        """Premium user (user_type=2) should have unlimited AI generations."""
        from apps.payments.services.credit_service import CreditService

        user = self._make_user(user_type=2)
        allowance = CreditService.get_ai_generation_allowance(user)
        assert allowance["unlimited"]

    def test_record_generation_increments_counter(self):
        """record_ai_generation should increment the monthly counter."""
        from apps.payments.services.credit_service import CreditService

        user = self._make_user(user_type=1)
        assert user.ai_generations_this_month == 0

        CreditService.record_ai_generation(user)
        user.refresh_from_db()
        assert user.ai_generations_this_month == 1

    def test_counter_resets_on_new_month(self):
        """Counter should reset to 1 when a new month begins."""
        import datetime

        from apps.payments.services.credit_service import CreditService

        user = self._make_user(user_type=1)
        # Simulate counter from last month
        user.ai_generations_this_month = 3
        user.ai_generation_reset_date = datetime.date.today().replace(
            day=1
        ) - datetime.timedelta(days=1)
        user.save()

        CreditService.record_ai_generation(user)
        user.refresh_from_db()
        assert user.ai_generations_this_month == 1
