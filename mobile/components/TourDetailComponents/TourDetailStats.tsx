import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { TourDetailStatsProps } from './TourDetailStats.config';
import { tourDetailStatsStyles } from './TourDetailStats.styles';
import { getDifficultyColor } from './TourDetail.config';
import { useTranslation } from 'react-i18next';

type BadgeTone = 'info' | 'warning' | 'success';

interface Badge {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: BadgeTone;
}

export default function TourDetailStats({
  duration,
  distance,
  difficulty,
  elevationGain,
  requiresTransport,
  isCircular,
  accessibilityRating,
  metricsCalculated,
}: TourDetailStatsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailStatsStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const difficultyColor = getDifficultyColor(difficulty, theme);
  const distanceUnknown = distance === '—';

  const badges: Badge[] = [];
  if (isCircular) {
    badges.push({ icon: 'repeat-outline', label: t('tourDetail.loop'), tone: 'success' });
  }
  if (requiresTransport) {
    badges.push({ icon: 'bus-outline', label: t('tourDetail.transport'), tone: 'warning' });
  }
  if (elevationGain != null && elevationGain >= 30) {
    badges.push({
      icon: 'trending-up-outline',
      label: `↑ ${Math.round(elevationGain)} m`,
      tone: 'info',
    });
  }
  if (accessibilityRating != null && accessibilityRating > 0) {
    badges.push({
      icon: 'walk-outline',
      label: `${accessibilityRating}/10`,
      tone: accessibilityRating >= 7 ? 'success' : accessibilityRating >= 4 ? 'info' : 'warning',
    });
  }
  if (metricsCalculated === false && !distanceUnknown) {
    badges.push({ icon: 'alert-circle-outline', label: t('tourDetail.estimated'), tone: 'info' });
  }

  const badgeBackground: Record<BadgeTone, string> = {
    info: colors.primary + '22',
    warning: colors.medium + '2A',
    success: colors.easy + '2A',
  };
  const badgeColor: Record<BadgeTone, string> = {
    info: colors.primary,
    warning: colors.medium,
    success: colors.easy,
  };

  return (
    <View>
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
            color={distanceUnknown ? colors.subText : colors.primary}
            style={styles.statIcon}
          />
          <Text style={[styles.statValue, distanceUnknown && { color: colors.subText }]}>
            {distance}
          </Text>
          <Text style={styles.statLabel}>
            {distanceUnknown ? t('tourDetail.distanceUnknown') : t('tourDetail.distance')}
          </Text>
        </View>

        <View
          style={[styles.statCard, { borderBottomWidth: 3, borderBottomColor: difficultyColor }]}
        >
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

      {badges.length > 0 && (
        <View style={styles.badgeRow}>
          {badges.map((badge, idx) => (
            <View
              key={`${badge.label}-${idx}`}
              style={[styles.badge, { backgroundColor: badgeBackground[badge.tone] }]}
            >
              <Ionicons name={badge.icon} size={14} color={badgeColor[badge.tone]} />
              <Text style={[styles.badgeLabel, { color: badgeColor[badge.tone] }]}>
                {badge.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
