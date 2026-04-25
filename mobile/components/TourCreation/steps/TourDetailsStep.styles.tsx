import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailsStepStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';
  return StyleSheet.create({
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    introCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
      shadowColor: isDark ? '#000' : color.text,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.25 : 0.07,
      shadowRadius: 16,
      elevation: 3,
    },
    introIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    introIconGlyph: {
      color: color.primary,
    },
    introCopy: {
      flex: 1,
      minWidth: 0,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
    },
    completionPill: {
      minWidth: 48,
      height: 32,
      borderRadius: 16,
      backgroundColor: color.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
      marginLeft: Spacing.sm,
    },
    completionValue: {
      color: color.white,
      fontWeight: '800',
      fontSize: 13,
    },
    formCard: {
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
    },
  });
};
