import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailMapProps } from './TourDetailMap.config';
import { tourDetailMapStyles } from './TourDetailMap.styles';

// TODO: Replace MapPlaceholder with actual map implementation
export default function TourDetailMap({ stops }: TourDetailMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailMapStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Route Map</Text>
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapPlaceholderText}>🗺️ Map Component</Text>
          <Text style={styles.mapPlaceholderSubtext}>{stops.length} stops to display</Text>
        </View>
      </View>
    </View>
  );
}
