import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailStatsProps } from './TourDetailStats.config';
import { tourDetailStatsStyles } from './TourDetailStats.styles';
import { getDifficultyColor } from './TourDetail.config';
import { useTranslation } from 'react-i18next';

export default function TourDetailStats({ duration, distance, difficulty }: TourDetailStatsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailStatsStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{duration}</Text>
        <Text style={styles.statLabel}>{t('tourDetail.duration')}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{distance}</Text>
        <Text style={styles.statLabel}>{t('tourDetail.distance')}</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: getDifficultyColor(difficulty, theme) }]}>
          {t(`tourDetail.${difficulty.toLowerCase()}`)}
        </Text>
        <Text style={styles.statLabel}>{t('tourDetail.difficulty')}</Text>
      </View>
    </View>
  );
}
