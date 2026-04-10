import React, { useState, forwardRef } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { authTextInputStyle, getPlaceholderColor } from './AuthTextInput.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { AuthTextInputProps } from './AuthTextInput.config';

const AuthTextInput = forwardRef<TextInput, AuthTextInputProps>(function AuthTextInput(
  {
    label,
    error,
    accessibilityLabel,
    accessibilityHint,
    showPasswordToggle,
    secureTextEntry,
    onFocus,
    onBlur,
    ...rest
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const resolvedAccessibilityLabel = accessibilityLabel ?? label;
  const theme = useColorTheme();
  const styles = authTextInputStyle(theme);
  const color = Colors[theme];
  const placeholderColor = getPlaceholderColor(theme);

  const isSecure = showPasswordToggle ? !showPassword : secureTextEntry;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.inputRowFocused,
          !!error && styles.inputRowError,
        ]}
      >
        <TextInput
          ref={ref}
          style={styles.textInput}
          placeholderTextColor={placeholderColor}
          accessibilityLabel={resolvedAccessibilityLabel}
          accessibilityHint={accessibilityHint}
          secureTextEntry={isSecure}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowPassword((s) => !s)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? color.primary : placeholderColor}
            />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
});

export default AuthTextInput;
