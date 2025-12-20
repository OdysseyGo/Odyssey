import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { formTextAreaStyles } from './FormTextArea.styles';

type FormTextAreaProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  numberOfLines?: number;
} & Omit<TextInputProps, 'style'>;

export default function FormTextArea({
  value,
  onChangeText,
  placeholder,
  numberOfLines = 4,
  ...rest
}: FormTextAreaProps) {
  const theme = useColorTheme();
  const styles = formTextAreaStyles(theme);
  const color = Colors[theme];

  return (
    <TextInput
      style={[styles.textInput, styles.textArea]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={color.placeholderTextColor}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      {...rest}
    />
  );
}
