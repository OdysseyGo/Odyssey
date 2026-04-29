import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { aiCreationHeaderStyles } from './AICreationHeader.styles';
import { useTranslation } from 'react-i18next';

type AICreationHeaderProps = {
  title?: string;
  subtitle?: string;
};

export default function AICreationHeader({ title, subtitle }: AICreationHeaderProps) {
  const theme = useColorTheme();
  const styles = aiCreationHeaderStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="sparkles" size={40} color={color.primary} />
      </View>
      <Text style={styles.title}>{title ?? t('aiTour.header.title')}</Text>
      <Text style={styles.subtitle}>{subtitle ?? t('aiTour.header.subtitle')}</Text>
    </View>
  );
}
