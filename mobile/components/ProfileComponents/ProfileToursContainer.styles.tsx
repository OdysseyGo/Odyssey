import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileToursContainerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    container: {
      marginTop: Spacing.xl,
      paddingHorizontal: Spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm + 2,
    },
    accentBar: {
      width: 3.5,
      height: 20,
      borderRadius: 2,
      backgroundColor: color.primary,
    },
    title: {
      fontSize: 19,
      fontWeight: '700',
      color: color.text,
      letterSpacing: -0.3,
    },
    completedToursButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: Spacing.borderRadiusFull,
      backgroundColor: isLight ? color.primaryMuted : color.foreground,
    },
    completedToursButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: color.primary,
    },

    // Segmented control
    tabsContainer: {
      flexDirection: 'row',
      borderRadius: 14,
      backgroundColor: isLight ? color.foreground : color.foreground,
      padding: 3,
      marginBottom: Spacing.lg,
      ...(isLight
        ? {
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: color.borderLight,
          }
        : {}),
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm + 1,
      borderRadius: 11,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: color.primary,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isLight ? 0.25 : 0.3,
          shadowRadius: 6,
        },
        android: { elevation: 3 },
      }),
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: color.subText,
    },
    tabTextActive: {
      color: color.white,
      fontWeight: '700',
    },

    toursList: {
      gap: Spacing.sm + 2,
    },
    emptyStateText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      paddingVertical: Spacing.xxl,
    },
    loadingContainer: {
      paddingVertical: Spacing.xxl,
      alignItems: 'center',
    },
  });
};
