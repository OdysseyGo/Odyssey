import { TourStop } from './TourDetail.config';

export interface RouteMapProps {
  stops: TourStop[];
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Calculate the optimal region to fit all stops
export function calculateRegion(stops: TourStop[]): MapRegion {
  if (stops.length === 0) {
    return {
      latitude: 41.0082,
      longitude: 28.9784,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  }

  const lats = stops.map((s) => s.latitude);
  const lons = stops.map((s) => s.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;

  // Add padding to the delta
  const latDelta = Math.max((maxLat - minLat) * 1.5, 0.01);
  const lonDelta = Math.max((maxLon - minLon) * 1.5, 0.01);

  return {
    latitude: centerLat,
    longitude: centerLon,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

// Generate route coordinates from stops (sorted by order)
export function getRouteCoordinates(stops: TourStop[]): { latitude: number; longitude: number }[] {
  return [...stops]
    .sort((a, b) => a.order - b.order)
    .map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
}
