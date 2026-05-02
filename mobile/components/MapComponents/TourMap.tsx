import { useMemo, useEffect, useRef } from 'react';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

import getStyles from './TourMap.styles';
import { TourMapProps } from './TourMap.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import MapMarker from './MapMarker';
import ClusterMarker from './ClusterMarker';

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
  clusterMarkers,
  animateToRegion,
}: TourMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const mapRef = useRef<MapView>(null);

  // Get user location on mount (but don't animate if there's an active tour)
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});

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
    })();
  }, [onUserLocationReady, tour]);

  useEffect(() => {
    if (mapRef.current && animateToRegion) {
      mapRef.current.animateToRegion(animateToRegion, 400);
    }
  }, [animateToRegion]);

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
          key={`${marker.id}-${marker.coverImage ?? 'none'}`}
          id={marker.id}
          coordinate={marker.coordinate}
          title={marker.title}
          iconType={marker.iconType}
          circleSize={marker.circleSize}
          circleColor={marker.circleColor}
          opacity={marker.opacity}
          coverImage={marker.coverImage}
          onPress={marker.onPress}
          selected={marker.selected}
        />
      ))}

      {clusterMarkers?.map((cluster) => (
        <ClusterMarker
          key={cluster.id}
          id={cluster.id}
          coordinate={cluster.coordinate}
          count={cluster.count}
          onPress={cluster.onPress}
        />
      ))}

      {route.length >= 2 && (
        <Polyline coordinates={route} strokeWidth={4} strokeColor={colors.primary} />
      )}
    </MapView>
  );
}
