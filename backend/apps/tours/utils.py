import logging
import math
import os
import re
from html import unescape
from typing import Any, Dict, List, Optional

import googlemaps
import pycountry
from django.core.cache import cache

from .models import Tour, TourStep

PLACES_CACHE_TTL_SECONDS = 24 * 60 * 60

logger = logging.getLogger(__name__)

GOOGLE_MAPS_TIMEOUT_SECONDS = 5
CITY_MATCH_RADIUS_KM = 100.0

STREET_CIRCUITY_FACTOR = 1.3
WALKING_PACE_M_PER_MIN = 80.0
CIRCULAR_THRESHOLD_M = 200.0
LONG_LEG_TRANSPORT_THRESHOLD_M = 2000.0


def normalize_tour_country(
    country: str | None, country_code: str | None
) -> tuple[str, str]:
    """
    Normalize country fields for persistence.

    - country_code is normalized to uppercase.
    - when country_code maps to an ISO-3166 alpha-2 country, country is canonicalized
      to that country's English name.
    - if mapping fails, keep the provided country text unchanged.
    """
    normalized_country = (country or "").strip()
    normalized_country_code = (country_code or "").strip().upper()

    if not normalized_country_code:
        return normalized_country, ""

    matched_country = pycountry.countries.get(alpha_2=normalized_country_code)
    if matched_country is None:
        return normalized_country, normalized_country_code

    canonical_country = (
        getattr(matched_country, "name", "").strip() or normalized_country
    )
    return canonical_country, normalized_country_code


class GoogleMapsFacade:
    """
    Facade for interacting with Google Maps API to calculate tour metrics.
    Includes Directions and Elevation APIs.
    """

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.client = None
        if self.api_key:
            self.client = googlemaps.Client(
                key=self.api_key,
                timeout=GOOGLE_MAPS_TIMEOUT_SECONDS,
                retry_timeout=GOOGLE_MAPS_TIMEOUT_SECONDS,
            )

    def geocode_location(
        self,
        name: str,
        city: str,
        fallback_lat: float,
        fallback_lng: float,
    ) -> tuple[float, float]:
        """
        Look up a location by name and city via Google Geocoding API.

        Returns verified (latitude, longitude) from Google's database.
        Falls back to the provided AI-generated coordinates if geocoding
        fails or returns no results.
        """
        if not self.client:
            return (fallback_lat, fallback_lng)

        try:
            results = self.client.geocode(f"{name}, {city}")
            if results:
                location = results[0]["geometry"]["location"]
                return (location["lat"], location["lng"])
        except Exception as e:
            print(f"Geocoding failed for '{name}, {city}': {e}")

        return (fallback_lat, fallback_lng)

    def tour_has_step_in_city(
        self,
        tour,
        city_latitude: Optional[float] = None,
        city_longitude: Optional[float] = None,
    ) -> bool:
        steps = list(tour.steps.all())
        if not steps:
            return False

        if city_latitude is None or city_longitude is None:
            return False

        try:
            center_lat = float(city_latitude)
            center_lng = float(city_longitude)
        except (TypeError, ValueError):
            return False

        for step in steps:
            try:
                step_lat = float(step.latitude)
                step_lng = float(step.longitude)
            except (TypeError, ValueError):
                continue

            distance_km = self._haversine_km(
                step_lat,
                step_lng,
                center_lat,
                center_lng,
            )
            if distance_km <= CITY_MATCH_RADIUS_KM:
                return True

        return False

    @staticmethod
    def _haversine_km(
        lat1: float,
        lng1: float,
        lat2: float,
        lng2: float,
    ) -> float:
        radius_km = 6371.0
        lat1_rad, lng1_rad = math.radians(lat1), math.radians(lng1)
        lat2_rad, lng2_rad = math.radians(lat2), math.radians(lng2)

        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return radius_km * c

    def search_places(
        self,
        city: str,
        theme: str,
        max_results: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search for real places in a city matching a theme via Google Maps
        Text Search API.

        Returns a list of dicts, each containing:
            - name: str (official place name)
            - place_id: str (Google Place ID)
            - latitude: float
            - longitude: float
            - address: str (formatted address)
            - types: list[str] (Google place types)

        Falls back to generic "points of interest" if the themed search
        returns fewer than 5 results.
        """
        if not self.client:
            return []

        cache_key = (
            f"places:{city.strip().lower()}|{theme.strip().lower()}|{max_results}"
        )
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        places: List[Dict[str, Any]] = []
        seen_place_ids: set = set()

        def _extract(results: list) -> None:
            """Parse raw Google API results into our standardised format."""
            for r in results:
                pid = r.get("place_id")
                if not pid or pid in seen_place_ids:
                    continue
                geo = r.get("geometry", {}).get("location", {})
                lat = geo.get("lat")
                lng = geo.get("lng")
                if lat is None or lng is None:
                    continue
                seen_place_ids.add(pid)
                places.append(
                    {
                        "name": r.get("name", "Unknown"),
                        "place_id": pid,
                        "latitude": lat,
                        "longitude": lng,
                        "address": r.get("formatted_address", ""),
                        "types": r.get("types", []),
                    }
                )

        # --- Primary themed search ---
        try:
            query = f"{theme} in {city}"
            response = self.client.places(query=query)
            _extract(response.get("results", []))

            # Paginate if we have a next_page_token and need more results
            while len(places) < max_results and response.get("next_page_token"):
                import time

                time.sleep(2)  # Google requires a short delay before using page tokens
                response = self.client.places(
                    query=query,
                    page_token=response["next_page_token"],
                )
                _extract(response.get("results", []))
        except Exception as e:
            print(f"Places search failed for '{theme} in {city}': {e}")

        # --- Fallback: generic search if themed search returned too few ---
        if len(places) < 5:
            try:
                fallback_query = f"popular landmarks and points of interest in {city}"
                response = self.client.places(query=fallback_query)
                _extract(response.get("results", []))
            except Exception as e:
                print(f"Fallback places search failed for '{city}': {e}")

        result = places[:max_results]
        if result:
            cache.set(cache_key, result, PLACES_CACHE_TTL_SECONDS)
        return result

    @staticmethod
    def _strip_html(value: str) -> str:
        if not value:
            return ""
        text = re.sub(r"<[^>]+>", "", value)
        return unescape(text).strip()

    def get_place_photo(
        self,
        place_id: str,
        max_width: int = 1200,
    ) -> Optional[Dict[str, str]]:
        """
        Resolve a Google Places photo URL and attribution for a place_id.

        Returns:
            {"url": "...", "attribution": "..."} or None
        """
        if not self.client or not self.api_key or not place_id:
            return None

        try:
            details = self.client.place(place_id=place_id, fields=["photo"])
            result = details.get("result") or {}
            photos = result.get("photos") or []
            if not photos:
                return None

            first_photo = photos[0]
            photo_reference = first_photo.get("photo_reference")
            if not photo_reference:
                return None

            attribution_items = first_photo.get("html_attributions") or []
            attribution = ", ".join(
                filter(
                    None,
                    [
                        self._strip_html(str(item))
                        for item in attribution_items
                        if item is not None
                    ],
                )
            )
            photo_url = (
                "https://maps.googleapis.com/maps/api/place/photo"
                f"?maxwidth={max_width}"
                f"&photo_reference={photo_reference}"
                f"&key={self.api_key}"
            )
            return {
                "url": photo_url,
                "attribution": attribution,
            }
        except Exception as e:
            print(f"Place photo lookup failed for place_id '{place_id}': {e}")
            return None

    def calculate_route_metrics(self, steps: List[TourStep]) -> Dict[str, Any]:
        """
        Calculate distance, duration, elevation, and path features.

        Returns:
            Dict with keys:
            - total_distance (meters)
            - duration_minutes
            - walking_distance
            - elevation_gain (meters)
            - max_leg_distance (meters)
            - requires_transport (bool)
            - is_circular (bool)
            - success (bool)
        """
        if not self.client or len(steps) < 2:
            return {"success": False}

        # Sort steps by order
        sorted_steps = sorted(steps, key=lambda s: s.order)

        origin = (sorted_steps[0].latitude, sorted_steps[0].longitude)
        destination = (sorted_steps[-1].latitude, sorted_steps[-1].longitude)

        waypoints = []
        if len(sorted_steps) > 2:
            for step in sorted_steps[1:-1]:
                waypoints.append((step.latitude, step.longitude))

        try:
            # 1. Directions API
            directions_result = self.client.directions(
                origin,
                destination,
                waypoints=waypoints,
                mode="walking",
                optimize_waypoints=False,
            )

            if not directions_result:
                return {"success": False}

            route = directions_result[0]
            legs = route.get("legs", [])

            total_distance = 0.0
            total_duration_seconds = 0.0
            max_leg_distance = 0.0
            requires_transport = False

            # Collect path points for Elevation API
            path_points = []

            # Add origin point first
            # We can't exceed 512 points for elevation usually, so we might need to sample if very long.
            # But Directions API 'path' is encoded polyline. We can use legs' start/end for simplicity
            # OR decode the polyline. Decoding polyline gives best accuracy for elevation.
            # For simplicity and quota, let's just use start/end of each step + midpoints if possible?
            # Actually, googlemaps library auto-decodes overview_polyline.

            overview_polyline = route.get("overview_polyline", {}).get("points")
            if overview_polyline:
                path_points = googlemaps.convert.decode_polyline(overview_polyline)
            else:
                # Fallback to leg start/end points
                path_points.append(origin)
                for leg in legs:
                    path_points.append(leg.get("end_location"))

            # --- Leg metrics ---
            for leg in legs:
                leg_dist = leg.get("distance", {}).get("value", 0)
                leg_dur = leg.get("duration", {}).get("value", 0)

                total_distance += leg_dist
                total_duration_seconds += leg_dur

                if leg_dist > max_leg_distance:
                    max_leg_distance = leg_dist

                # Heuristic: If a single walking leg is > 2000m (2km), implies long walk
                # that might need public transport or is just very tiring.
                if leg_dist > 2000:
                    requires_transport = True

            # --- Elevation API ---
            elevation_gain = 0.0
            if path_points:
                # Limit points to avoid payload limits (max 512 locations per request)
                # Simple sampling if too many
                if len(path_points) > 500:
                    step_size = len(path_points) // 500 + 1
                    path_points = path_points[::step_size]

                try:
                    elevation_results = self.client.elevation(path_points)
                    # Calculate cumulative gain
                    prev_elev = None
                    for point in elevation_results:
                        curr_elev = point.get("elevation")
                        if prev_elev is not None:
                            diff = curr_elev - prev_elev
                            if diff > 0:
                                elevation_gain += diff
                        prev_elev = curr_elev
                except Exception as elev_err:
                    print(f"Elevation API error: {elev_err}")
                    # Continue without failing the whole request, assume flat
                    elevation_gain = 0.0

            # --- Circular Check ---
            # Distance between start and end < 200m?
            # Using Haversine is overkill, just use rough pythagoras on latch/lng or existing dist if we had it.
            # But we can just use the coords.
            lat1, lng1 = (
                float(sorted_steps[0].latitude),
                float(sorted_steps[0].longitude),
            )
            lat2, lng2 = (
                float(sorted_steps[-1].latitude),
                float(sorted_steps[-1].longitude),
            )

            # Approx distance in meters (deg * 111km)
            d_lat = (lat2 - lat1) * 111320
            d_lng = (lng2 - lng1) * 111320 * math.cos(math.radians(lat1))
            crow_dist = math.sqrt(d_lat**2 + d_lng**2)

            is_circular = crow_dist < 200

            return {
                "total_distance": total_distance,
                "walking_distance": total_distance,  # Assuming all walking
                "duration_minutes": int(total_duration_seconds / 60),
                "elevation_gain": elevation_gain,
                "max_leg_distance": max_leg_distance,
                "requires_transport": requires_transport,
                "is_circular": is_circular,
                "success": True,
            }

        except Exception as e:
            print(f"Error calculating route metrics: {e}")
            return {"success": False}

    def estimate_accessibility(self, data: Dict[str, Any]) -> int:
        """
        Walkability rating (1-10). 10 = very easy, 1 = very hard.

        Distance is the primary signal; elevation and an unusually long
        single leg add secondary penalties. Duration is intentionally not
        used — it correlates with distance for walking tours and would
        double-count.
        """
        dist_km = data.get("total_distance", 0) / 1000.0
        elev = data.get("elevation_gain", 0) or 0
        max_leg_km = data.get("max_leg_distance", 0) / 1000.0
        req_transport = data.get("requires_transport", False)

        score = 10.0

        # Distance: free under 3 km, then -0.6 per extra km, capped at -5.
        if dist_km > 3:
            score -= min(5.0, (dist_km - 3) * 0.6)

        # Elevation: free under 50 m, then -1 per extra 100 m, capped at -3.
        if elev > 50:
            score -= min(3.0, (elev - 50) / 100.0)

        # Pacing: long single legs make the tour harder to break up.
        if max_leg_km > 2.5:
            score -= 2
        elif max_leg_km > 1.5:
            score -= 1

        # Transport: small extra penalty for routes that effectively need it.
        if req_transport:
            score -= 1

        return max(1, min(10, int(round(score))))


def _haversine_fallback_metrics(steps: List[TourStep]) -> Dict[str, Any]:
    if len(steps) < 2:
        return {"success": False}

    sorted_steps = sorted(steps, key=lambda s: s.order)
    total_distance = 0.0
    max_leg = 0.0

    for a, b in zip(sorted_steps, sorted_steps[1:]):
        straight_m = (
            GoogleMapsFacade._haversine_km(
                float(a.latitude),
                float(a.longitude),
                float(b.latitude),
                float(b.longitude),
            )
            * 1000
        )
        leg_m = straight_m * STREET_CIRCUITY_FACTOR
        total_distance += leg_m
        max_leg = max(max_leg, leg_m)

    end_dist_m = (
        GoogleMapsFacade._haversine_km(
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
        "duration_minutes": int(total_distance / WALKING_PACE_M_PER_MIN),
        "elevation_gain": 0.0,
        "max_leg_distance": max_leg,
        "requires_transport": max_leg > LONG_LEG_TRANSPORT_THRESHOLD_M,
        "is_circular": end_dist_m < CIRCULAR_THRESHOLD_M,
        "success": True,
        "estimated": True,
    }


def recalculate_tour_metrics(tour: Tour) -> None:
    """Compute distance/elevation/accessibility for a manually-built tour.

    Tries the Google Directions+Elevation pipeline first; falls back to a
    haversine estimate so the tour always has a non-zero distance once it
    has at least two stops. Does not touch tour.duration_minutes — that
    field is user-controlled for manual tours.
    """
    try:
        steps = list(tour.steps.all())
        if len(steps) < 2:
            tour.total_distance = 0.0
            tour.walking_distance = 0.0
            tour.elevation_gain = 0.0
            tour.max_leg_distance = 0.0
            tour.requires_transport = False
            tour.is_circular = False
            tour.metrics_calculated = False
            tour.accessibility_rating = None
            tour.save(
                update_fields=[
                    "total_distance",
                    "walking_distance",
                    "elevation_gain",
                    "max_leg_distance",
                    "requires_transport",
                    "is_circular",
                    "metrics_calculated",
                    "accessibility_rating",
                    "updated_at",
                ]
            )
            return

        facade = GoogleMapsFacade()
        metrics = facade.calculate_route_metrics(steps)

        if not metrics.get("success"):
            logger.info(
                "Directions API failed for tour %s; using haversine fallback.",
                tour.pk,
            )
            metrics = _haversine_fallback_metrics(steps)

        if not metrics.get("success"):
            return

        tour.total_distance = metrics.get("total_distance", 0.0)
        tour.walking_distance = metrics.get("walking_distance", 0.0)
        tour.elevation_gain = metrics.get("elevation_gain", 0.0)
        tour.max_leg_distance = metrics.get("max_leg_distance", 0.0)
        tour.requires_transport = metrics.get("requires_transport", False)
        tour.is_circular = metrics.get("is_circular", False)
        tour.metrics_calculated = True
        tour.accessibility_rating = facade.estimate_accessibility(metrics)
        tour.save(
            update_fields=[
                "total_distance",
                "walking_distance",
                "elevation_gain",
                "max_leg_distance",
                "requires_transport",
                "is_circular",
                "metrics_calculated",
                "accessibility_rating",
                "updated_at",
            ]
        )
    except Exception as e:
        logger.warning("Failed to recalculate tour metrics for %s: %s", tour.pk, e)
