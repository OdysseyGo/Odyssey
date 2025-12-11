import os
import sys
from unittest.mock import patch

import django

from apps.tours.models import TourStep
from apps.tours.utils import GoogleMapsFacade

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
os.environ["SECRET_KEY"] = "test-key"
os.environ["GEMINI_API_KEY"] = "dummy"
os.environ["GOOGLE_MAPS_API_KEY"] = "dummy"

django.setup()


def test_metrics_logic():
    print("Testing Comprehensive Metrics Logic...")

    with patch("apps.tours.utils.googlemaps.Client") as MockClient:
        client = MockClient.return_value

        # MOCK DATA
        # 3 Legs:
        # Leg 1: 500m, 5min
        # Leg 2: 2500m, 25min (Long leg -> Should trigger requires_transport)
        # Leg 3: 500m, 5min
        # Total: 3500m, 35min

        client.directions.return_value = [
            {
                "legs": [
                    {
                        "distance": {"value": 500},
                        "duration": {"value": 300},
                        "end_location": {"lat": 10, "lng": 10},
                    },
                    {
                        "distance": {"value": 2500},
                        "duration": {"value": 1500},
                        "end_location": {"lat": 10, "lng": 10},
                    },
                    {
                        "distance": {"value": 500},
                        "duration": {"value": 300},
                        "end_location": {"lat": 10, "lng": 10},
                    },
                ],
                "overview_polyline": {"points": "mock_polyline"},
            }
        ]

        # Mock Elevation: 4 points. 0->10m->20m->30m. Total gain 30m.
        client.elevation.return_value = [
            {"elevation": 0},
            {"elevation": 10},
            {"elevation": 20},
            {"elevation": 30},
        ]

        # Helper for decoding polyline mock
        with patch(
            "apps.tours.utils.googlemaps.convert.decode_polyline",
            return_value=[(10, 10)] * 4,
        ):
            facade = GoogleMapsFacade()
            steps = [TourStep(latitude=0, longitude=0, order=i) for i in range(1, 5)]

            metrics = facade.calculate_route_metrics(steps)
            print(f"Metrics: {metrics}")

            assert metrics["total_distance"] == 3500
            assert metrics["duration_minutes"] == 35
            assert metrics["elevation_gain"] == 30.0
            assert metrics["max_leg_distance"] == 2500
            assert metrics["requires_transport"]

            # --- Accessibility Score Check ---
            # Dist: 3500m -> -3.5
            # Dur: 35m -> -1.16
            # Elev: 30m -> -1.0
            # Pacing: 2500m -> -2.5
            # Transport: True -> -2
            # Base: 10
            # Total Penalty: ~10.16 -> Score < 1 -> Should be 1

            score = facade.estimate_accessibility(metrics)
            print(f"Calculated Score: {score}")
            assert score == 1  # Harsh penalties for transport + bad pacing + distance

            # Test a "perfect" tour
            # 500m, 5 min, 0 elev, max leg 500m
            # MOCK DATA 2
            client.directions.return_value = [
                {
                    "legs": [
                        {
                            "distance": {"value": 500},
                            "duration": {"value": 300},
                            "end_location": {"lat": 10, "lng": 10},
                        }
                    ],
                    "overview_polyline": {"points": "mock_polyline"},
                }
            ]
            client.elevation.return_value = [
                {"elevation": 10},
                {"elevation": 10},
            ]  # Flat

            metrics_easy = facade.calculate_route_metrics(steps[:2])
            score_easy = facade.estimate_accessibility(metrics_easy)
            print(f"Easy Tour Score: {score_easy}")
            # Penalties:
            # Dist 500m -> -0.5
            # Dur 5m -> -0.16
            # Elev 0 -> 0
            # Pacing 500m -> -0.5
            # Trans -> 0
            # Total Pen: ~1.16 -> Score ~9
            assert score_easy >= 8


if __name__ == "__main__":
    try:
        test_metrics_logic()
        print("\nCOMPREHENSIVE VERIFICATION PASSED")
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
    except Exception as e:
        print(f"\nERROR: {e}")
