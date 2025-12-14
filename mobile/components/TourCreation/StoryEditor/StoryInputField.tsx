import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { storyInputFieldStyles } from './StoryInputField.styles';
import Colors from '@/constants/Colors';

type StoryInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  showCharacterCount?: boolean;
};

export default function StoryInputField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  multiline = false,
  showCharacterCount = false,
}: StoryInputFieldProps) {
  const theme = useColorTheme();
  const styles = storyInputFieldStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.labelHint}>{hint}</Text>}
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.placeholderTextColor}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {showCharacterCount && <Text style={styles.characterCount}>{value.length} characters</Text>}
    </View>
  );
}
