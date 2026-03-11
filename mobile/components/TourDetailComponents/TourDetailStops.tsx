import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailStopsProps } from './TourDetailStops.config';
import { tourDetailStopsStyles } from './TourDetailStops.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailStops({ stops }: TourDetailStopsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailStopsStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t('tourDetail.tourStops')} ({stops.length})</Text>
      {stops.map((stop, index) => (
        <View key={stop.id} style={styles.stopItem}>
          <View style={styles.stopNumber}>
            <Text style={styles.stopNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.stopContent}>
            <Text style={styles.stopTitle}>{stop.title}</Text>
            <Text style={styles.stopDescription}>{stop.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
