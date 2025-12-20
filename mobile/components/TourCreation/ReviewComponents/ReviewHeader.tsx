import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { reviewHeaderStyles } from './ReviewHeader.styles';

type ReviewHeaderProps = {
  title: string;
  subtitle: string;
};

export default function ReviewHeader({ title, subtitle }: ReviewHeaderProps) {
  const theme = useColorTheme();
  const styles = reviewHeaderStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
