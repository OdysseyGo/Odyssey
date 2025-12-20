import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const stepIndicatorStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: color.foregroundSecondary,
    },
    dotActive: {
      backgroundColor: color.primary,
      width: 24,
    },
    dotCompleted: {
      backgroundColor: color.primary,
    },
  });
};
