import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailScreenStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    // ─── Error card
    errorCard: {
      alignItems: 'center',
      padding: Spacing.xxl,
      borderRadius: 26,
      gap: Spacing.md,
      maxWidth: 300,
      width: '100%',
    },
    errorIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    errorTitle: {
      fontSize: 19,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    errorText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 21,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadiusFull,
      marginTop: Spacing.xs,
    },
    retryButtonText: {
      fontSize: 15,
      fontWeight: '700',
    },
    bottomSpacer: {
      height: 120,
    },
  });
};
