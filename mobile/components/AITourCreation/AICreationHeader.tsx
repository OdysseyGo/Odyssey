import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { aiCreationHeaderStyles } from './AICreationHeader.styles';

type AICreationHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function AICreationHeader({
  title = 'Create with AI',
  subtitle = 'Tell us about your dream tour and let AI craft a unique experience with real locations, engaging stories, and interactive content.',
}: AICreationHeaderProps) {
  const theme = useColorTheme();
  const styles = aiCreationHeaderStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={40} color={color.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
