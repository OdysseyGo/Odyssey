import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileBadgesContainerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      marginHorizontal: Spacing.lg,
      width: '90%',
      maxWidth: 500,
      alignSelf: 'center',

      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
    },
    badgeCount: {
      fontSize: 14,
      color: 'white',
      backgroundColor: color.primary,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius,
      fontWeight: '600',
      overflow: 'hidden',
    },
    badgesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    badgeItem: {
      flex: 1,
      minWidth: '30%',
      alignItems: 'center',
    },
    viewAllButton: {
      marginTop: Spacing.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      backgroundColor: color.primary,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
    },
    viewAllButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
    emptyStateText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      paddingVertical: Spacing.lg,
    },
  });
};
