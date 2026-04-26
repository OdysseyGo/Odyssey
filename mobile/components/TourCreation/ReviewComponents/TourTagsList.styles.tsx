import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourTagsListStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    tag: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: 8,
      backgroundColor: color.primaryMuted,
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    tagText: {
      fontSize: 14,
      color: color.primary,
      fontWeight: '700',
    },
  });
};
