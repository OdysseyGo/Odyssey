import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { generateButtonStyles } from './GenerateButton.styles';

type GenerateButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  label?: string;
};

export default function GenerateButton({
  onPress,
  disabled = false,
  isLoading = false,
  label = 'Generate Tour',
}: GenerateButtonProps) {
  const theme = useColorTheme();
  const styles = generateButtonStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled || isLoading}
      >
        <Ionicons name="sparkles" size={20} color={color.white} />
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
