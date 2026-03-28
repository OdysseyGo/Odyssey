import math
import os
from typing import Any, Dict, List

import googlemaps

from .models import TourStep


class GoogleMapsFacade:
    """
    Facade for interacting with Google Maps API to calculate tour metrics.
    Includes Directions and Elevation APIs.
    """

    def __init__(self):
        self.api_key = os.getenv("GOOGLE_MAPS_API_KEY")
        self.client = None
        if self.api_key:
            self.client = googlemaps.Client(key=self.api_key)

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

        return places[:max_results]

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
            lat1, lng1 = float(sorted_steps[0].latitude), float(
                sorted_steps[0].longitude
            )
            lat2, lng2 = float(sorted_steps[-1].latitude), float(
                sorted_steps[-1].longitude
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
        Comprehensive accessibility rating (1-10).
        10 = Very Easy, 1 = Very Hard

        Factors:
        - Total Distance (Base penalty)
        - Duration (Base penalty)
        - Elevation Gain (Steepness penalty)
        - Max Leg Distance (Pacing penalty)
        - Requires Transport (Complexity penalty)
        """
        # Unpack
        dist = data.get("total_distance", 0)
        dur = data.get("duration_minutes", 0)
        elev = data.get("elevation_gain", 0)
        max_leg = data.get("max_leg_distance", 0)
        req_transport = data.get("requires_transport", False)

        score = 10.0

        # 1. Distance Penalty: -1 per 1km (1000m)
        score -= dist / 1000

        # 2. Duration Penalty: -1 per 30 mins
        score -= dur / 30

        # 3. Elevation Penalty: -1 per 30m gain (approx 10 floors)
        score -= elev / 30

        # 4. Pacing Penalty: -1 if max leg > 1km, -2 if > 2km (already handled by transport flag logic approx)
        # Let's be linear: -0.5 per 500m of max leg
        score -= max_leg / 1000

        # 5. Transport Complexity: -2 flat if transport likely needed
        if req_transport:
            score -= 2

        # Cap range
        final_score = int(round(score))
        return max(1, min(10, final_score))
