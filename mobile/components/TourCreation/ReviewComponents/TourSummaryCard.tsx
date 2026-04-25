import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourSummaryCardStyles } from './TourSummaryCard.styles';

type TourSummaryCardProps = {
  title: string;
  description: string;
};

export default function TourSummaryCard({ title, description }: TourSummaryCardProps) {
  const theme = useColorTheme();
  const styles = tourSummaryCardStyles(theme);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="flag-outline" size={22} style={styles.icon} />
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}
