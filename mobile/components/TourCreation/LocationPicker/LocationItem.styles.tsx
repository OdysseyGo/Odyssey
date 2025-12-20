import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationItemStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      borderColor: color.borderLight,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    locationItemSelected: {
      borderWidth: 2,
      borderColor: color.primary,
    },
    locationOrder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    locationOrderText: {
      fontSize: 14,
      fontWeight: '700',
      color: color.text,
    },
    locationInfo: {
      flex: 1,
    },
    locationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
    },
    locationTitlePlaceholder: {
      color: color.subText,
      fontStyle: 'italic',
    },
    locationCoords: {
      fontSize: 12,
      color: color.subText,
      marginTop: 2,
    },
    locationActions: {
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    locationActionButton: {
      padding: Spacing.xs,
    },
  });
};
