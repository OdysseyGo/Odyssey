import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileToursContainerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.lg,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      width: '90%',
      maxWidth: 500,
      alignSelf: 'center',

      shadowColor: color.textShadowColor,
      shadowOpacity: 0.1,
      shadowRadius: Spacing.lg,
      shadowOffset: { width: 0, height: Spacing.sm },
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
    },
    tabsContainer: {
      flexDirection: 'row',
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.secondary,
      padding: 4,
      marginBottom: Spacing.lg,
    },
    tab: {
      flex: 1,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadius - 2,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: color.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: color.subText,
    },
    tabTextActive: {
      color: 'white',
      fontWeight: '600',
    },
    toursList: {
      gap: Spacing.md,
    },
    emptyStateText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      paddingVertical: Spacing.xl,
    },
    loadingContainer: {
      paddingVertical: Spacing.xl,
      alignItems: 'center',
    },
  });
};
