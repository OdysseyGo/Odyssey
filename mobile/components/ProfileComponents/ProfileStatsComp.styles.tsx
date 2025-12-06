import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileStatsCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginTop: -Spacing.xxl,
      width: '90%',
      alignSelf: 'center',

      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
      maxWidth: 500,
    },

    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
      paddingHorizontal: '10%',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginTop: Spacing.xs,
      color: color.text,
    },
    statLabel: {
      fontSize: 14,
      color: color.subText,
      marginTop: Spacing.xs,
    },

    divider: {
      height: 1,
      backgroundColor: '#E5E5E5',
      marginVertical: Spacing.md,
    },

    bottomRow: {
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    bottomItem: {
      alignItems: 'center',
      flex: 1,
    },
    bottomValue: {
      fontSize: 22,
      fontWeight: '600',
      color: color.text,
    },
    bottomLabel: {
      fontSize: 14,
      color: color.subText,
      marginTop: Spacing.xs,
    },

    bottomDivider: {
      width: 1,
      height: '80%',
      backgroundColor: '#E0E0E0',
    },
  });
};
