import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { formTextInputStyles } from './FormTextInput.styles';

type FormTextInputProps = {
  value: string | undefined;
  onChangeText: (text: string) => void;
  placeholder?: string;
} & Omit<TextInputProps, 'style'>;

export default function FormTextInput({
  value,
  onChangeText,
  placeholder,
  ...rest
}: FormTextInputProps) {
  const theme = useColorTheme();
  const styles = formTextInputStyles(theme);
  const color = Colors[theme];

  return (
    <TextInput
      style={styles.textInput}
      value={value ?? ''}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={color.placeholderTextColor}
      {...rest}
    />
  );
}
