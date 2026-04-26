import { MapMarkerProps, exampleMapMarkers } from './MapMarker.config';

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface TourMapProps {
  markers: MapMarkerProps[];
  route: RouteCoordinate[];
  initialRegion?: Region;
  currentStepIndex?: number;
  tour?: { steps: { coordinate: { latitude: number; longitude: number } }[] };
  onRegionChange?: (region: Region) => void;
  onRegionChangeComplete?: (region: Region) => void;
  onUserLocationReady?: (region: Region) => void;
  nearbyMarkers?: MapMarkerProps[];
}

export const exampleTourMap: TourMapProps = {
  markers: exampleMapMarkers,
  route: [
    { latitude: 41.0082, longitude: 28.9784 },
    { latitude: 41.0151, longitude: 28.9795 },
  ],
  initialRegion: {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  },
};
