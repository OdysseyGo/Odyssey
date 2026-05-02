import React from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { loadingOverlayStyles } from './LoadingOverlay.styles';
import { useTranslation } from 'react-i18next';

type LoadingOverlayProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export default function LoadingOverlay({
  visible,
  title,
  subtitle,
  cancelLabel,
  onCancel,
}: LoadingOverlayProps) {
  const theme = useColorTheme();
  const styles = loadingOverlayStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={color.primary} />
        <Text style={styles.title}>{title ?? t('aiTour.loading.title')}</Text>
        <Text style={styles.subtitle}>{subtitle ?? t('aiTour.loading.subtitle')}</Text>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelText}>{cancelLabel ?? t('aiTour.loading.cancel')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
