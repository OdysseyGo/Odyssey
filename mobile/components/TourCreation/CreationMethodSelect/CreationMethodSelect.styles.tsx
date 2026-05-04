import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: screenWidth } = Dimensions.get('window');

export const creationMethodStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      flex: 1,
      padding: Spacing.xl,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: color.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: color.subText,
      textAlign: 'center',
      marginBottom: Spacing.xxl,
    },
    optionsContainer: {
      width: '100%',
      maxWidth: 400,
      gap: Spacing.lg,
    },
    optionCard: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.xl,
      borderWidth: 2,
      borderColor: color.borderLight,
      alignItems: 'center',
    },
    optionCardPressed: {
      borderColor: color.primary,
      backgroundColor: color.foregroundSecondary,
    },
    optionIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: color.foregroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    optionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    optionDescription: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      lineHeight: 20,
    },
    disabledCard: {
      opacity: 0.5,
    },
    lockedBadge: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: color.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.sm,
    },
    lockedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: color.white,
    },
    comingSoonBadge: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      backgroundColor: color.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.sm,
    },
    comingSoonText: {
      fontSize: 10,
      fontWeight: '600',
      color: color.white,
    },
    skipButton: {
      marginTop: Spacing.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Spacing.borderRadius,
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.foreground,
    },
    skipText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
      textAlign: 'center',
    },
  });
};
