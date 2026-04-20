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
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('tourDetail.tourStops')}</Text>
        <View style={styles.stopCountBadge}>
          <Text style={styles.stopCount}>{stops.length}</Text>
        </View>
      </View>

      {stops.map((stop, index) => {
        const isFirst = index === 0;
        const isLast = index === stops.length - 1;

        return (
          <View key={stop.id} style={styles.stopItem}>
            {/* Timeline */}
            <View style={styles.timelineColumn}>
              <View style={[styles.stopNumber, isFirst && styles.stopNumberFirst]}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              {!isLast && <View style={styles.connectorLine} />}
            </View>

            {/* Content card */}
            <View style={[styles.stopContent, isLast && styles.stopContentLast]}>
              <View style={styles.stopCard}>
                <Text style={styles.stopTitle}>{stop.title}</Text>
                <Text style={styles.stopDescription} numberOfLines={3}>
                  {stop.description}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
