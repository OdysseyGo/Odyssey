import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    wrapper: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      zIndex: 20,
    },
    shadow: {
      borderRadius: Spacing.xxl,
      shadowColor: color.profileHeaderShadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: theme === 'dark' ? 0.45 : 0.18,
      shadowRadius: 20,
      elevation: 14,
    },
    panel: {
      backgroundColor: color.cardSurface,
      borderRadius: Spacing.xxl,
      borderWidth: 1,
      borderColor: color.borderLight,
      overflow: 'hidden',
      padding: Spacing.md,
      gap: Spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    thumbnail: {
      width: 90,
      height: 90,
      borderRadius: Spacing.borderRadius,
    },
    iconBox: {
      width: 90,
      height: 90,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: {
      flex: 1,
      minWidth: 0,
      paddingRight: 28, // space for close button
      gap: 5,
      justifyContent: 'center',
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: color.text,
      lineHeight: 19,
    },
    creator: {
      fontSize: 12,
      color: color.subText,
      fontWeight: '500',
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 2,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: Spacing.borderRadiusFull,
      backgroundColor: color.borderLight,
    },
    tagText: {
      fontSize: 10,
      fontWeight: '600',
      color: color.subText,
    },
    difficultyText: {
      color: color.white,
    },
    closeButton: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: color.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
    },
    viewButtonText: {
      fontSize: 13,
      fontWeight: '700',
    },
  });
}
