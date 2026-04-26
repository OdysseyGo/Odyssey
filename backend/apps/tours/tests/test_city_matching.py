from types import SimpleNamespace

from django.test import SimpleTestCase

from apps.tours.utils import CITY_MATCH_RADIUS_KM, GoogleMapsFacade


class _FakeSteps:
    def __init__(self, steps):
        self._steps = steps

    def all(self):
        return self._steps


def _make_tour(steps):
    return SimpleNamespace(steps=_FakeSteps(steps))


def _make_step(latitude, longitude):
    return SimpleNamespace(latitude=latitude, longitude=longitude)


class TourCityMatchingTests(SimpleTestCase):
    def setUp(self):
        self.facade = GoogleMapsFacade.__new__(GoogleMapsFacade)

    def test_accepts_when_at_least_one_step_is_within_100_km(self):
        tour = _make_tour(
            steps=[
                _make_step(38.4192, 27.1287),  # Izmir, far
                _make_step(39.9255, 32.8663),  # Ankara, near
            ]
        )

        self.assertTrue(
            self.facade.tour_has_step_in_city(
                tour,
                city_latitude=39.9334,
                city_longitude=32.8597,
            )
        )

    def test_rejects_when_no_steps_are_within_100_km(self):
        tour = _make_tour(
            steps=[
                _make_step(38.4192, 27.1287),  # Izmir
                _make_step(41.0082, 28.9784),  # Istanbul
            ]
        )

        self.assertFalse(
            self.facade.tour_has_step_in_city(
                tour,
                city_latitude=39.9334,
                city_longitude=32.8597,
            )
        )

    def test_rejects_when_city_coordinates_missing(self):
        tour = _make_tour(steps=[_make_step(39.9255, 32.8663)])
        self.assertFalse(self.facade.tour_has_step_in_city(tour))

    def test_ignores_invalid_step_coordinates(self):
        tour = _make_tour(
            steps=[
                _make_step("invalid", "invalid"),
                _make_step(39.9255, 32.8663),
            ]
        )

        self.assertTrue(
            self.facade.tour_has_step_in_city(
                tour,
                city_latitude=39.9334,
                city_longitude=32.8597,
            )
        )

    def test_haversine_zero_distance_within_radius(self):
        distance = self.facade._haversine_km(39.9334, 32.8597, 39.9334, 32.8597)
        self.assertLessEqual(distance, CITY_MATCH_RADIUS_KM)
