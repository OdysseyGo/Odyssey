import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileTourCardStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    card: {
      backgroundColor: color.cardSurface,
      borderRadius: 16,
      padding: Spacing.md + 2,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isLight ? color.borderLight : color.foregroundSecondary,
      ...(isLight
        ? Platform.select({
            ios: {
              shadowColor: 'rgba(45,50,68,0.10)',
              shadowOpacity: 1,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 3 },
            },
            android: { elevation: 2 },
          })
        : {}),
    },
    cardPressed: {
      opacity: 0.75,
      ...(isLight ? { backgroundColor: color.foreground } : {}),
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    infoContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: 4,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
      flex: 1,
      letterSpacing: -0.2,
    },
    statusBadge: {
      paddingVertical: 2,
      paddingHorizontal: Spacing.sm,
      borderRadius: 6,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    metaText: {
      fontSize: 12,
      color: color.subText,
    },
    editIconButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.xs,
      backgroundColor: color.primaryMuted,
    },
    arrowContainer: {
      marginLeft: Spacing.xs,
      opacity: 0.35,
    },
  });
};
