import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationFooterStyles } from './CreationFooter.styles';

type CreationFooterProps = {
  buttonText: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function CreationFooter({
  buttonText,
  onPress,
  disabled = false,
}: CreationFooterProps) {
  const theme = useColorTheme();
  const styles = creationFooterStyles(theme);

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  );
}
