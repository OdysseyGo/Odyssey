import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formInputGroupStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    inputGroup: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.xs,
    },
  });
};
