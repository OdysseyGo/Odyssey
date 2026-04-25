import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const creationMethodStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      flex: 1,
      padding: Spacing.lg,
      justifyContent: 'center',
    },
    hero: {
      borderRadius: 8,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
      shadowColor: isDark ? '#000' : color.primary,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: isDark ? 0.35 : 0.18,
      shadowRadius: 22,
      elevation: 8,
    },
    heroIcon: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: 30,
      fontWeight: '800',
      color: color.white,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 16,
      color: 'rgba(248,250,252,0.86)',
      lineHeight: 23,
    },
    optionsContainer: {
      width: '100%',
      gap: Spacing.md,
    },
    optionCard: {
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: color.borderLight,
      overflow: 'hidden',
      shadowColor: isDark ? '#000' : color.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.24 : 0.08,
      shadowRadius: 18,
      elevation: 4,
    },
    optionCardPressed: {
      borderColor: color.primary,
      backgroundColor: color.foregroundSecondary,
    },
    optionAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 5,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    optionIconContainer: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    optionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
    },
    optionMeta: {
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
      textTransform: 'uppercase',
    },
    optionDescription: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 21,
      paddingLeft: Spacing.xs,
    },
    disabledCard: {
      opacity: 0.5,
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
      color: color.primary,
    },
    skipButton: {
      marginTop: Spacing.xl,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.cardSurface,
      alignSelf: 'center',
    },
    skipText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
      textAlign: 'center',
    },
  });
};
