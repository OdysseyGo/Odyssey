import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { instructionBannerStyles } from './InstructionBanner.styles';
import { useTranslation } from 'react-i18next';

type InstructionBannerProps = {
  message?: string;
  topOffset?: number;
};

export default function InstructionBanner({ message, topOffset }: InstructionBannerProps) {
  const theme = useColorTheme();
  const styles = instructionBannerStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={[styles.instructionBanner, topOffset !== undefined && { top: topOffset }]}>
      <Ionicons name="information-circle" size={24} color={color.primary} />
      <Text style={styles.instructionText}>
        {message ?? t('creation.location.instructionBanner')}
      </Text>
    </View>
  );
}
