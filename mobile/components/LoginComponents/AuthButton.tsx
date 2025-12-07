import React from 'react';

import { authButtonStyles } from './AuthButton.styles';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { AuthButtonProps } from './AuthButton.config';

export default function AuthButton({ title, onPress, disabled, loading }: AuthButtonProps) {
  const theme = useColorTheme();
  const styles = authButtonStyles(theme);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator accessibilityLabel="Loading" />
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
