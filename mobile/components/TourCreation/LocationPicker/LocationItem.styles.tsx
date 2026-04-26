import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationItemStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
    },
    locationItemSelected: {
      borderColor: color.primary,
      backgroundColor: color.primaryMuted,
    },
    locationStatusRail: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 5,
      backgroundColor: color.borderLight,
    },
    locationStatusRailSelected: {
      backgroundColor: color.primary,
    },
    locationOrder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: color.primaryMuted,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Spacing.md,
      marginLeft: Spacing.xs,
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    locationOrderText: {
      fontSize: 14,
      fontWeight: '700',
      color: color.primary,
    },
    locationInfo: {
      flex: 1,
      minWidth: 0,
    },
    locationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
      flexShrink: 1,
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
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.foregroundSecondary,
    },
  });
};
