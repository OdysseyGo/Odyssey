import { View, Text, Pressable } from 'react-native';
import { useMemo, useState } from 'react';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { RouteMapProps, calculateRegion, getRouteCoordinates } from './RouteMap.config';
import { routeMapStyles } from './RouteMap.styles';

export default function RouteMap({ stops }: RouteMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => routeMapStyles(theme), [theme]);
  const colors = Colors[theme];
  const [interactive, setInteractive] = useState(false);

  const region = useMemo(() => calculateRegion(stops), [stops]);
  const routeCoordinates = useMemo(() => getRouteCoordinates(stops), [stops]);

  // Sort stops by order for consistent display
  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.order - b.order), [stops]);

  if (stops.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {/* Route path */}
        {routeCoordinates.length >= 2 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor={colors.primary}
            lineDashPattern={[0]}
          />
        )}

        {/* Stop markers */}
        {sortedStops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={{
              latitude: stop.latitude,
              longitude: stop.longitude,
            }}
            title={stop.title}
            description={stop.description}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerCircle}>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </View>
            </View>
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{stop.title}</Text>
                <Text style={styles.calloutDescription} numberOfLines={2}>
                  {stop.description}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {!interactive ? (
        <Pressable style={styles.overlay} onPress={() => setInteractive(true)}>
          <Text style={styles.overlayHint}>Tap to interact with map</Text>
        </Pressable>
      ) : (
        <Pressable style={styles.doneButton} onPress={() => setInteractive(false)}>
          <Text style={styles.doneButtonText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}
