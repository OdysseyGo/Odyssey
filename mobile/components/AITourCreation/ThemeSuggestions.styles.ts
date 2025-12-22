import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const themeSuggestionsStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foregroundSecondary,
    },
    chipText: {
      fontSize: 12,
      color: color.subText,
    },
  });
};
