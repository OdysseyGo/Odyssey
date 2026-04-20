import { TextInputProps } from 'react-native';

export type AuthTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  showPasswordToggle?: boolean;
};
