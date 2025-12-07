import React from 'react';
import { View, TextInput, Text } from 'react-native';
import { authTextInputStyle, getPlaceholderColor } from './AuthTextInput.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { AuthTextInputProps } from './AuthTextInput.config';

export default function AuthTextInput({
  label,
  error,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}: AuthTextInputProps) {
  const resolvedAccessibilityLabel = accessibilityLabel ?? label;

  const theme = useColorTheme();
  const styles = authTextInputStyle(theme);
  const placeholderColor = getPlaceholderColor(theme);
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={placeholderColor}
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityHint={accessibilityHint}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
