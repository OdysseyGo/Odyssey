import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailMapProps } from './TourDetailMap.config';
import { tourDetailMapStyles } from './TourDetailMap.styles';
import RouteMap from './RouteMap';

export default function TourDetailMap({ stops }: TourDetailMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailMapStyles(theme), [theme]);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Route Map</Text>
      <View style={styles.mapContainer}>
        <RouteMap stops={stops} />
      </View>
    </View>
  );
}
