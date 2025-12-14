import React from 'react';
import { View, Text } from 'react-native';
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}
