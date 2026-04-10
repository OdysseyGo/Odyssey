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
    titleSection: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xs,
    },
    tourTitle: {
      color: color.text,
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: Spacing.sm,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    star: {
      color: color.star,
      fontSize: 15,
    },
    ratingText: {
      color: color.text,
      fontSize: 15,
      fontWeight: '700',
    },
    reviewCount: {
      color: color.subText,
      fontSize: 13,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: 16,
    },
    errorText: {
      marginTop: Spacing.md,
      fontSize: 16,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    retryText: {
      marginTop: Spacing.md,
      fontSize: 16,
      fontWeight: '600',
    },
    bottomSpacer: {
      height: 120,
    },
  });
};
