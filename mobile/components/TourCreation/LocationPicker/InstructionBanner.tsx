import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { instructionBannerStyles } from './InstructionBanner.styles';

type InstructionBannerProps = {
  message?: string;
};

export default function InstructionBanner({
  message = 'Tap on the map to add tour stops.',
}: InstructionBannerProps) {
  const theme = useColorTheme();
  const styles = instructionBannerStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.instructionBanner}>
      <Ionicons name="information-circle" size={24} color={color.primary} />
      <Text style={styles.instructionText}>{message}</Text>
    </View>
  );
}
