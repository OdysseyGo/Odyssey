import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailStatsProps } from './TourDetailStats.config';
import { tourDetailStatsStyles } from './TourDetailStats.styles';
import { getDifficultyColor } from './TourDetail.config';
import { useTranslation } from 'react-i18next';

export default function TourDetailStats({ duration, distance, difficulty }: TourDetailStatsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailStatsStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const difficultyColor = getDifficultyColor(difficulty, theme);

  return (
    <View style={styles.statsRow}>
      <View style={styles.statCard}>
        <Ionicons name="time-outline" size={24} color={colors.primary} style={styles.statIcon} />
        <Text style={styles.statValue}>{duration}</Text>
        <Text style={styles.statLabel}>{t('tourDetail.duration')}</Text>
      </View>

      <View style={styles.statCard}>
        <Ionicons
          name="navigate-outline"
          size={24}
          color={colors.primary}
          style={styles.statIcon}
        />
        <Text style={styles.statValue}>{distance}</Text>
        <Text style={styles.statLabel}>{t('tourDetail.distance')}</Text>
      </View>

      <View style={[styles.statCard, { borderBottomWidth: 3, borderBottomColor: difficultyColor }]}>
        <Ionicons
          name="trending-up-outline"
          size={24}
          color={difficultyColor}
          style={styles.statIcon}
        />
        <Text style={[styles.statValue, { color: difficultyColor }]}>
          {t(`tourDetail.${difficulty.toLowerCase()}`)}
        </Text>
        <Text style={styles.statLabel}>{t('tourDetail.difficulty')}</Text>
      </View>
    </View>
  );
}
