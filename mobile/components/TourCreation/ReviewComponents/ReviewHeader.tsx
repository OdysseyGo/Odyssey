import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-done-outline" size={24} style={styles.icon} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
