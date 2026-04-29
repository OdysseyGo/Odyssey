import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const searchHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.md,
      backgroundColor: color.background,
      gap: Spacing.md,
    },
    segmentedControl: {
      flexDirection: 'row',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.borderLight,
    },
    segmentButton: {
      flex: 1,
      minHeight: 38,
      borderRadius: Spacing.borderRadius - 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentButtonActive: {
      backgroundColor: color.primary,
    },
    segmentText: {
      fontSize: 14,
      fontWeight: '700',
      color: color.subText,
    },
    segmentTextActive: {
      color: color.white,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      height: 48,
    },
    searchIcon: {
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: color.text,
    },
    clearButton: {
      padding: Spacing.xs,
    },
  });
};
