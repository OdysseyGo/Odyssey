import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourStatsRowStyles } from './TourStatsRow.styles';

type TourStatsRowProps = {
  locationCount: number;
  duration: number;
  difficulty: string;
};

export default function TourStatsRow({ locationCount, duration, difficulty }: TourStatsRowProps) {
  const theme = useColorTheme();
  const styles = tourStatsRowStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{locationCount}</Text>
        <Text style={styles.statLabel}>Locations</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{duration}</Text>
        <Text style={styles.statLabel}>Minutes</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{difficulty}</Text>
        <Text style={styles.statLabel}>Difficulty</Text>
      </View>
    </View>
  );
}
