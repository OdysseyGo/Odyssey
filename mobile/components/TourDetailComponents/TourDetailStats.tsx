import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourDetailStatsProps } from './TourDetailStats.config';
import { tourDetailStatsStyles } from './TourDetailStats.styles';
import { getDifficultyColor } from './TourDetail.config';

export default function TourDetailStats({ duration, distance, difficulty }: TourDetailStatsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailStatsStyles(theme), [theme]);

  return (
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{duration}</Text>
        <Text style={styles.statLabel}>Duration</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{distance}</Text>
        <Text style={styles.statLabel}>Distance</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={[styles.statValue, { color: getDifficultyColor(difficulty) }]}>
          {difficulty}
        </Text>
        <Text style={styles.statLabel}>Difficulty</Text>
      </View>
    </View>
  );
}
