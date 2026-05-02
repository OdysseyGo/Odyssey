import { useMemo, useEffect, useRef } from 'react';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

import getStyles from './TourMap.styles';
import { TourMapProps } from './TourMap.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
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
  onRegionChange,
  onRegionChangeComplete,
  onUserLocationReady,
  nearbyMarkers,
}: TourMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const mapRef = useRef<MapView>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      mapRef.current = null;
    };
  }, []);

  // Get user location on mount (but don't animate if there's an active tour)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled || !mountedRef.current || status !== 'granted') return;

        let currentLocation = await Location.getCurrentPositionAsync({});
        if (cancelled || !mountedRef.current) return;

        const userRegion = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        onUserLocationReady?.(userRegion);

        if (mapRef.current && !tour) {
          mapRef.current.animateToRegion(userRegion, 1000);
        }
      } catch (error) {
        if (!cancelled && mountedRef.current) {
          console.warn('Unable to read current location for map', error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onUserLocationReady, tour]);

  // Animate to current step when it changes (for active tours)
  useEffect(() => {
    if (mountedRef.current && mapRef.current && tour && currentStepIndex !== undefined) {
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
      onRegionChange={onRegionChange}
      onRegionChangeComplete={onRegionChangeComplete}
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

      {nearbyMarkers?.map((marker) => (
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

      {route.length >= 2 && (
        <Polyline coordinates={route} strokeWidth={4} strokeColor={colors.primary} />
      )}
    </MapView>
  );
}
