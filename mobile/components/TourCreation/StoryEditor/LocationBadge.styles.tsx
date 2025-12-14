import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationBadgeStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.primary,
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.borderRadius,
      marginBottom: Spacing.lg,
    },
    locationBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: color.text,
      marginLeft: Spacing.xs,
    },
  });
};
