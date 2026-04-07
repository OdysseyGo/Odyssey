import { StyleSheet, Platform } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileStatsCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isLight = theme === 'light';

  return StyleSheet.create({
    card: {
      backgroundColor: color.cardSurface,
      borderRadius: 22,
      marginTop: -Spacing.xxl,
      width: '88%',
      alignSelf: 'center',
      overflow: 'hidden',
      ...(isLight ? { borderWidth: StyleSheet.hairlineWidth, borderColor: color.borderLight } : {}),
      ...Platform.select({
        ios: {
          shadowColor: isLight ? 'rgba(45,50,68,0.16)' : '#000',
          shadowOpacity: 1,
          shadowRadius: isLight ? 24 : 20,
          shadowOffset: { width: 0, height: isLight ? 10 : 8 },
        },
        android: { elevation: isLight ? 8 : 6 },
      }),
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.md,
    },

    hDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isLight ? 'rgba(45,50,68,0.1)' : color.foregroundSecondary,
      marginHorizontal: Spacing.md,
    },

    vDivider: {
      width: StyleSheet.hairlineWidth,
      height: 28,
      backgroundColor: isLight ? 'rgba(45,50,68,0.1)' : color.foregroundSecondary,
    },

    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
    },

    statValue: {
      fontSize: 20,
      fontWeight: '800',
      color: color.text,
      letterSpacing: -0.3,
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: color.subText,
      textTransform: 'uppercase',
    },
  });
};
