import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailMapProps } from './TourDetailMap.config';
import { tourDetailMapStyles } from './TourDetailMap.styles';
import RouteMap from './RouteMap';
import { useTranslation } from 'react-i18next';
import { getStepsThroughFirstPuzzle } from '@/utils/tourStepVisibility';

export default function TourDetailMap({ stops, showAllStops = false }: TourDetailMapProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailMapStyles(theme), [theme]);
  const { t } = useTranslation();
  const visibleStops = useMemo(
    () => (showAllStops ? stops : getStepsThroughFirstPuzzle(stops, (stop) => stop.hasPuzzle)),
    [showAllStops, stops]
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('tourDetail.routeMap')}</Text>
      <View style={styles.mapContainer}>
        <RouteMap stops={visibleStops} />
      </View>
    </View>
  );
}
