import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { loadingOverlayStyles } from './LoadingOverlay.styles';

type LoadingOverlayProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
};

export default function LoadingOverlay({
  visible,
  title = 'Creating Your Tour...',
  subtitle = 'AI is finding the best locations and crafting engaging content for you',
}: LoadingOverlayProps) {
  const theme = useColorTheme();
  const styles = loadingOverlayStyles(theme);
  const color = Colors[theme];

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={color.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}
