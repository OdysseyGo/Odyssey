import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formChipSelectStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    chip: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foregroundSecondary,
      borderWidth: 1,
      borderColor: color.primary,
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
      color: color.text,
    },
  });
};
