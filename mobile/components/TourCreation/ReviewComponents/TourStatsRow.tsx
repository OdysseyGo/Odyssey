import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourStatsRowStyles } from './TourStatsRow.styles';
import { useTranslation } from 'react-i18next';

type TourStatsRowProps = {
  locationCount: number;
  duration: number;
  difficulty: string;
};

export default function TourStatsRow({ locationCount, duration, difficulty }: TourStatsRowProps) {
  const theme = useColorTheme();
  const styles = tourStatsRowStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{locationCount}</Text>
        <Text style={styles.statLabel}>{t('creation.stats.locations')}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{duration}</Text>
        <Text style={styles.statLabel}>{t('creation.stats.minutes')}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>
          {t(`creation.difficulty.${difficulty.toLowerCase()}`, { defaultValue: difficulty })}
        </Text>
        <Text style={styles.statLabel}>{t('creation.stats.difficulty')}</Text>
      </View>
    </View>
  );
}
