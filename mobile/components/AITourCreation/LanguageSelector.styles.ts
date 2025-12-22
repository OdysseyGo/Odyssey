import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const languageSelectorStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.md,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foreground,
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    chipSelected: {
      backgroundColor: color.primary,
      borderColor: color.primary,
    },
    chipText: {
      fontSize: 14,
      color: color.text,
    },
    chipTextSelected: {
      color: color.white,
      fontWeight: '600',
    },
  });
};
