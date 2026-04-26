import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationBadgeStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    locationBadgeIcon: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    locationBadgeIconGlyph: {
      color: color.primary,
    },
    locationBadgeCopy: {
      flex: 1,
      minWidth: 0,
    },
    locationBadgeLabel: {
      fontSize: 18,
      fontWeight: '800',
      color: color.text,
      marginBottom: 2,
    },
    locationBadgeText: {
      fontSize: 13,
      fontWeight: '700',
      color: color.subText,
    },
  });
};
