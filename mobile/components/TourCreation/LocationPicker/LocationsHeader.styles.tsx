import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationsHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: color.borderLight,
      backgroundColor: color.cardSurface,
    },
    locationsTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: color.text,
    },
    locationsCount: {
      fontSize: 12,
      color: color.primary,
      fontWeight: '800',
      textTransform: 'uppercase',
      backgroundColor: color.primaryMuted,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: 8,
      overflow: 'hidden',
    },
  });
};
