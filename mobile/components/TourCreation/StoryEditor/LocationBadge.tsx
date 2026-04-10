import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationBadgeStyles } from './LocationBadge.styles';
import { useTranslation } from 'react-i18next';

type LocationBadgeProps = {
  currentStop: number;
  totalStops: number;
};

export default function LocationBadge({ currentStop, totalStops }: LocationBadgeProps) {
  const theme = useColorTheme();
  const styles = locationBadgeStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.locationBadge}>
      <Ionicons name="location" size={16} color="#fff" />
      <Text style={styles.locationBadgeText}>
        {t('creation.story.stopOf', { current: currentStop, total: totalStops })}
      </Text>
    </View>
  );
}
