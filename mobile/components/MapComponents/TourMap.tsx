import { useMemo, useEffect, useRef } from 'react';
import MapView, { Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

import getStyles from './TourMap.styles';
import type { TourMapMode, TourMapProps } from './TourMap.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import MapMarker from './MapMarker';

const defaultRegion = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const NEARBY_TOUR_FOCUS_ANIMATION_MS = 900;

export default function TourMap({
  markers,
  route,
  initialRegion = defaultRegion,
  currentStepIndex,
  tour,
  onRegionChange,
  onRegionChangeComplete,
  onMapPress,
  onUserLocationReady,
  nearbyMarkers,
  animateToRegion,
  centerOnUserRequestKey,
  mapMode,
  mapInstanceKey,
}: TourMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const mapRef = useRef<MapView>(null);
  const onUserLocationReadyRef = useRef(onUserLocationReady);
  const instanceIdRef = useRef(`tm-${Math.random().toString(36).slice(2, 8)}`);
  const isMountedRef = useRef(true);
  const resolvedMapMode: TourMapMode = mapMode ?? (tour ? 'active-tour' : 'explore');
  const mountMetaRef = useRef({
    instanceId: instanceIdRef.current,
    mapMode: resolvedMapMode,
    mapInstanceKey: mapInstanceKey ?? 'unknown',
    markerCount: markers.length,
    routePointCount: route.length,
  });

  mountMetaRef.current = {
    instanceId: instanceIdRef.current,
    mapMode: resolvedMapMode,
    mapInstanceKey: mapInstanceKey ?? 'unknown',
    markerCount: markers.length,
    routePointCount: route.length,
  };

  useEffect(() => {
    onUserLocationReadyRef.current = onUserLocationReady;
  }, [onUserLocationReady]);

  useEffect(() => {
    isMountedRef.current = true;
    if (__DEV__) {
      console.log('[TourMap] mount', mountMetaRef.current);
    }
    return () => {
      isMountedRef.current = false;
      if (__DEV__) {
        console.log('[TourMap] unmount', mountMetaRef.current);
      }
    };
  }, []);

  // Get user location on mount (but don't animate if there's an active tour)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || !isMountedRef.current) {
        if (__DEV__) {
          console.log('[TourMap] async_location_ignored', {
            instanceId: instanceIdRef.current,
            reason: 'permission_after_unmount',
            mapMode: resolvedMapMode,
            mapInstanceKey: mapInstanceKey ?? 'unknown',
          });
        }
        return;
      }
      if (status !== 'granted') {
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      if (cancelled || !isMountedRef.current) {
        if (__DEV__) {
          console.log('[TourMap] async_location_ignored', {
            instanceId: instanceIdRef.current,
            reason: 'location_after_unmount',
            mapMode: resolvedMapMode,
            mapInstanceKey: mapInstanceKey ?? 'unknown',
          });
        }
        return;
      }

      const userRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

      onUserLocationReadyRef.current?.(userRegion);

      if (mapRef.current && !tour) {
        mapRef.current.animateToRegion(userRegion, 1000);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapInstanceKey, resolvedMapMode, tour]);

  useEffect(() => {
    if (mapRef.current && animateToRegion) {
      mapRef.current.animateToRegion(animateToRegion, NEARBY_TOUR_FOCUS_ANIMATION_MS);
    }
  }, [animateToRegion]);

  useEffect(() => {
    if (centerOnUserRequestKey === undefined) return;

    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled || !isMountedRef.current) {
        if (__DEV__) {
          console.log('[TourMap] async_location_ignored', {
            instanceId: instanceIdRef.current,
            reason: 'center_permission_after_unmount',
            mapMode: resolvedMapMode,
            mapInstanceKey: mapInstanceKey ?? 'unknown',
          });
        }
        return;
      }
      if (status !== 'granted') return;

      const currentLocation = await Location.getCurrentPositionAsync({});
      if (cancelled || !isMountedRef.current) {
        if (__DEV__) {
          console.log('[TourMap] async_location_ignored', {
            instanceId: instanceIdRef.current,
            reason: 'center_location_after_unmount',
            mapMode: resolvedMapMode,
            mapInstanceKey: mapInstanceKey ?? 'unknown',
          });
        }
        return;
      }
      const userRegion = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      onUserLocationReadyRef.current?.(userRegion);
      mapRef.current?.animateToRegion(userRegion, 850);
    })();
    return () => {
      cancelled = true;
    };
  }, [centerOnUserRequestKey, mapInstanceKey, resolvedMapMode]);

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
      onPress={onMapPress}
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

      {route.length >= 2 && (
        <Polyline coordinates={route} strokeWidth={4} strokeColor={colors.primary} />
      )}
    </MapView>
  );
}
