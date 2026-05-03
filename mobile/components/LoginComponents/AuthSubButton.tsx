import React from 'react';

import { authSubButtonStyles } from './AuthSubButton.styles';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { AuthSubButtonProps } from './AuthSubButton.config';
import { useTranslation } from 'react-i18next';

export default function AuthSubButton({ title, onPress, disabled, loading }: AuthSubButtonProps) {
  const theme = useColorTheme();
  const styles = authSubButtonStyles(theme);
  const { t } = useTranslation();
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator accessibilityLabel={t('common.loading')} />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
