import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationBadgeStyles } from './LocationBadge.styles';

type LocationBadgeProps = {
  currentStop: number;
  totalStops: number;
};

export default function LocationBadge({ currentStop, totalStops }: LocationBadgeProps) {
  const theme = useColorTheme();
  const styles = locationBadgeStyles(theme);

  return (
    <View style={styles.locationBadge}>
      <Ionicons name="location" size={16} color="#fff" />
      <Text style={styles.locationBadgeText}>
        Stop {currentStop} of {totalStops}
      </Text>
    </View>
  );
}
