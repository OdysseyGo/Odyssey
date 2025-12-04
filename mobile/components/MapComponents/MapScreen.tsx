import { View, Text, Pressable } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapScreenStyle } from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { useMemo } from 'react';

const initialRegion = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const sampleRoute = [
  { latitude: 41.0082, longitude: 28.9784 },
  { latitude: 41.0151, longitude: 28.9795 },
];

export default function MapScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => MapScreenStyle(theme), [theme]);

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion}>
        <Marker coordinate={initialRegion} title="Waypoint 1" />
        <Polyline coordinates={sampleRoute} strokeWidth={4} />
      </MapView>

      <SafeAreaView style={styles.topOverlay} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Text style={styles.title}>Map</Text>
          <Pressable style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>Add waypoint</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.bottomOverlay} pointerEvents="box-none">
        <View style={styles.bottomPanel}>
          <Text style={styles.panelTitle}>Route details</Text>
          <Text style={styles.panelText}>Route / waypoint UI goes here.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
