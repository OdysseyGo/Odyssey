import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { storyInputFieldStyles } from './StoryInputField.styles';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { sanitizeMultiLineText, sanitizeSingleLineText } from '@/utils/inputSanitizers';

type StoryInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  onFocus?: TextInputProps['onFocus'];
};

export default function StoryInputField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  multiline = false,
  showCharacterCount = false,
  maxLength,
  onFocus,
}: StoryInputFieldProps) {
  const theme = useColorTheme();
  const styles = storyInputFieldStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.labelHint}>{hint}</Text>}
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={(text) =>
          onChangeText(multiline ? sanitizeMultiLineText(text) : sanitizeSingleLineText(text))
        }
        placeholder={placeholder}
        placeholderTextColor={color.placeholderTextColor}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
        onFocus={onFocus}
      />
      {showCharacterCount && (
        <Text style={styles.characterCount}>
          {maxLength
            ? `${value.length}/${maxLength}`
            : t('creation.story.characters', { count: value.length })}
        </Text>
      )}
    </View>
  );
}
