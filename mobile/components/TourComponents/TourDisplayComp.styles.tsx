import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDisplayCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
    card: {
      marginHorizontal: Spacing.sm,
      width: 200,
      height: 260,
      backgroundColor: color.foreground,
      borderRadius: 20,
      overflow: 'hidden',
      marginTop: Spacing.lg,
      shadowColor: color.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.15,
      shadowRadius: 16,
      elevation: 8,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? color.borderLight : 'transparent',
    },
    cardPressed: {
      transform: [{ scale: 0.96 }],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      elevation: 4,
    },
    imageWrapper: {
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: color.borderLight,
    },
    image: {
      width: '100%',
      height: 130,
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'transparent',
    },
    ratingBadge: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      paddingHorizontal: Spacing.sm + 2,
      paddingVertical: Spacing.xs + 2,
      backgroundColor: color.backgroundBlack,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backdropFilter: 'blur(10px)',
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    star: {
      color: color.star,
      fontSize: 12,
    },
    ratingBadgeText: {
      color: color.white,
      fontWeight: '700',
      fontSize: 12,
      letterSpacing: 0.3,
    },
    durationBadge: {
      position: 'absolute',
      bottom: Spacing.sm,
      left: Spacing.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: color.primary,
      borderRadius: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    durationIcon: {
      color: color.white,
    },
    durationText: {
      color: color.white,
      fontWeight: '600',
      fontSize: 11,
    },
    infoContainer: {
      flex: 1,
      justifyContent: 'space-between',
      padding: Spacing.md,
      paddingTop: Spacing.sm + 2,
    },
    header: {
      width: '100%',
    },
    title: {
      color: color.primary,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
      lineHeight: 20,
      letterSpacing: -0.3,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: Spacing.xs,
    },
    authorIcon: {
      opacity: 0.6,
    },
    author: {
      fontSize: 12,
      color: color.subText,
      fontWeight: '500',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: Spacing.xs,
      borderTopWidth: 1,
      borderTopColor: color.borderLight,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaIcon: {
      opacity: 0.5,
    },
    metaText: {
      fontSize: 11,
      color: color.subText,
      fontWeight: '500',
    },
    metaDot: {
      fontSize: 8,
      color: color.subText,
      opacity: 0.4,
    },
  });
};
