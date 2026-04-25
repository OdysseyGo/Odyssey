import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const reviewHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginBottom: Spacing.lg,
      backgroundColor: color.primaryMuted,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
    },
  });
};
