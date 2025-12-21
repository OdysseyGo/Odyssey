import { useMemo, useState, useEffect, useRef } from 'react';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

import getStyles from './TourMap.styles';
import { TourMapProps } from './TourMap.config';
import { useColorTheme } from '@/utils/useColorTheme';
import MapMarker from './MapMarker';

const defaultRegion = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function TourMap({
  markers,
  route,
  initialRegion = defaultRegion,
  currentStepIndex,
  tour,
}: TourMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const hasAnimatedToTour = useRef(false);

  // Get user location on mount (but don't animate if there's an active tour)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Only animate to user location if there's no active tour
      if (mapRef.current && !tour) {
        mapRef.current.animateToRegion(
          {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          },
          1000
        );
      }
    })();
  }, [tour]);

  // Animate to current step when it changes (for active tours)
  useEffect(() => {
    if (mapRef.current && tour && currentStepIndex !== undefined) {
      const currentStep = tour.steps[currentStepIndex];
      if (currentStep) {
        mapRef.current.animateToRegion(
          {
            latitude: currentStep.coordinate.latitude,
            longitude: currentStep.coordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500
        );
      }
    }
  }, [currentStepIndex, tour]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={true}
      followsUserLocation={false}
    >
      {markers.map((marker) => (
        <MapMarker
          key={marker.id}
          id={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          iconType={marker.iconType}
          circleSize={marker.circleSize}
          circleColor={marker.circleColor}
          opacity={marker.opacity}
        />
      ))}
      <Polyline coordinates={route} strokeWidth={4} />
    </MapView>
  );
}
