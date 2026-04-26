"""Unit tests for TourGenerationService provider-agnostic RAG pipeline."""

import json
from unittest.mock import patch

import pytest
from django.test import TestCase

from apps.tours.models import Puzzle, Tour, TourStep

from .providers import build_provider
from .services import TourGenerationService


def _candidate_places() -> list[dict]:
    return [
        {
            "name": "Hagia Sophia",
            "place_id": "1",
            "latitude": 41.00860,
            "longitude": 28.98020,
            "address": "Sultan Ahmet, Istanbul",
            "types": ["tourist_attraction", "museum"],
        },
        {
            "name": "Blue Mosque",
            "place_id": "2",
            "latitude": 41.00550,
            "longitude": 28.97690,
            "address": "Sultan Ahmet, Istanbul",
            "types": ["mosque", "tourist_attraction"],
        },
        {
            "name": "Topkapi Palace",
            "place_id": "3",
            "latitude": 41.01140,
            "longitude": 28.98330,
            "address": "Cankurtaran, Istanbul",
            "types": ["museum", "tourist_attraction"],
        },
    ]


def _valid_tour_json(*, include_puzzles: bool = True) -> dict:
    step_base = {
        "title": "Hagia Sophia",
        "description": "A masterpiece of Byzantine architecture.",
        "latitude": 41.00860,
        "longitude": 28.98020,
        "puzzle": None,
    }
    step_2 = {
        "title": "Blue Mosque",
        "description": "The iconic Sultan Ahmed Mosque.",
        "latitude": 41.00550,
        "longitude": 28.97690,
        "puzzle": None,
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


class DummyProvider:
    def __init__(self, payload=None, error=None):
        self.payload = payload
        self.error = error

    def generate_tour_data(self, prompt: str, mode: str) -> dict:
        del prompt, mode
        if self.error:
            raise self.error
        return self.payload


@pytest.mark.django_db
class TestGenerateTour(TestCase):
    def _make_creator(self):
        from django.contrib.auth import get_user_model

        user_model = get_user_model()
        return user_model.objects.create_user(
            username="test_creator",
            password="pass123",
            email="creator@test.com",
        )

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_valid_response_creates_tour_steps_puzzles(self, mock_maps_cls):
        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

        service = TourGenerationService(
            providers=[DummyProvider(payload=_valid_tour_json(include_puzzles=True))]
        )
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="PUZZLE",
            duration=60,
            language="en",
            creator=self._make_creator(),
        )

        assert tour.title == "Historic Istanbul Walking Tour"
        assert tour.steps.count() == 2
        assert Puzzle.objects.filter(step__tour=tour).count() == 2

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_verified_coordinates_replace_ai_coords(self, mock_maps_cls):
        tour_data = _valid_tour_json(include_puzzles=False)
        tour_data["steps"][0]["latitude"] = 41.0
        tour_data["steps"][0]["longitude"] = 29.0

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

        service = TourGenerationService(providers=[DummyProvider(payload=tour_data)])
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=60,
            language="en",
            creator=self._make_creator(),
        )

        steps = list(tour.steps.order_by("order"))
        assert float(steps[0].latitude) == pytest.approx(41.00860, abs=1e-5)
        assert float(steps[0].longitude) == pytest.approx(28.98020, abs=1e-5)

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_no_places_found_raises_value_error(self, mock_maps_cls):
        mock_maps_cls.return_value.search_places.return_value = []

        service = TourGenerationService(providers=[DummyProvider(payload={})])

        with pytest.raises(ValueError, match="Could not find any real places"):
            service.generate_tour(
                city="Atlantis",
                theme="Underwater",
                mode="STORY",
                duration=60,
                language="en",
                creator=self._make_creator(),
            )

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_fuzzy_match_corrects_slightly_different_names(self, mock_maps_cls):
        tour_data = _valid_tour_json(include_puzzles=False)
        tour_data["steps"][0]["title"] = "Hagia Sophia Museum"
        tour_data["steps"][0]["latitude"] = 0
        tour_data["steps"][0]["longitude"] = 0

        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

        service = TourGenerationService(providers=[DummyProvider(payload=tour_data)])
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=60,
            language="en",
            creator=self._make_creator(),
        )

        steps = list(tour.steps.order_by("order"))
        assert float(steps[0].latitude) == pytest.approx(41.00860, abs=1e-5)

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_atomic_rollback_on_step_failure(self, mock_maps_cls):
        tour_data = _valid_tour_json(include_puzzles=False)
        tour_data["steps"].append(
            {"description": "No title here", "latitude": 41.0, "longitude": 28.0}
        )

        mock_maps_cls.return_value.search_places.return_value = _candidate_places()

        service = TourGenerationService(providers=[DummyProvider(payload=tour_data)])

        with pytest.raises(ValueError, match="missing required key 'title'"):
            service.generate_tour(
                city="Istanbul",
                theme="History",
                mode="STORY",
                duration=60,
                language="en",
                creator=self._make_creator(),
            )

        assert Tour.objects.count() == 0
        assert TourStep.objects.count() == 0

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_missing_title_raises_value_error(self, mock_maps_cls):
        mock_maps_cls.return_value.search_places.return_value = _candidate_places()

        service = TourGenerationService(
            providers=[DummyProvider(payload={"description": "A tour", "steps": []})]
        )

        with pytest.raises(ValueError, match="missing required keys.*title"):
            service.generate_tour(
                city="Paris",
                theme="Art",
                mode="STORY",
                duration=60,
                language="en",
                creator=self._make_creator(),
            )

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_empty_steps_raises_value_error(self, mock_maps_cls):
        mock_maps_cls.return_value.search_places.return_value = _candidate_places()

        service = TourGenerationService(
            providers=[
                DummyProvider(
                    payload={"title": "Tour", "description": "Desc", "steps": []}
                )
            ]
        )

        with pytest.raises(ValueError, match="non-empty list"):
            service.generate_tour(
                city="Paris",
                theme="Art",
                mode="STORY",
                duration=60,
                language="en",
                creator=self._make_creator(),
            )

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_puzzle_fallback_in_puzzle_mode(self, mock_maps_cls):
        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

        service = TourGenerationService(
            providers=[DummyProvider(payload=_valid_tour_json(include_puzzles=False))]
        )
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="PUZZLE",
            duration=60,
            language="en",
            creator=self._make_creator(),
        )

        puzzles = Puzzle.objects.filter(step__tour=tour)
        assert puzzles.count() == 2
        assert all("name of this location" in p.question for p in puzzles)

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_no_fallback_in_story_mode(self, mock_maps_cls):
        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

        service = TourGenerationService(
            providers=[DummyProvider(payload=_valid_tour_json(include_puzzles=False))]
        )
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=60,
            language="en",
            creator=self._make_creator(),
        )

        assert Puzzle.objects.filter(step__tour=tour).count() == 0

    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_duration_includes_exploration_time(self, mock_maps_cls):
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

        service = TourGenerationService(
            providers=[DummyProvider(payload=_valid_tour_json(include_puzzles=False))]
        )
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=60,
            language="en",
            creator=self._make_creator(),
        )

        assert tour.duration_minutes == 40


class TestProviderFallback(TestCase):
    @patch("apps.ai_content.services.GoogleMapsFacade")
    def test_fallback_provider_used_when_primary_fails(self, mock_maps_cls):
        mock_facade = mock_maps_cls.return_value
        mock_facade.search_places.return_value = _candidate_places()
        mock_facade.calculate_route_metrics.return_value = {"success": False}

        failing = DummyProvider(error=RuntimeError("boom"))
        fallback = DummyProvider(payload=_valid_tour_json(include_puzzles=False))

        from django.contrib.auth import get_user_model

        user = get_user_model().objects.create_user(
            username="fallback_creator",
            password="pass123",
            email="fallback@test.com",
        )

        service = TourGenerationService(providers=[failing, fallback])
        tour = service.generate_tour(
            city="Istanbul",
            theme="History",
            mode="STORY",
            duration=45,
            language="en",
            creator=user,
        )

        assert tour.title == "Historic Istanbul Walking Tour"


class TestParseResponse(TestCase):
    def _service(self):
        return TourGenerationService(providers=[DummyProvider(payload=_valid_tour_json())])

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


class TestBuildProvider(TestCase):
    @patch("apps.ai_content.providers.AzureOpenAIProvider")
    def test_build_provider_azure(self, mock_cls):
        build_provider("azure_openai")
        mock_cls.assert_called_once()

    @patch("apps.ai_content.providers.GeminiProvider")
    def test_build_provider_gemini(self, mock_cls):
        build_provider("gemini")
        mock_cls.assert_called_once()
