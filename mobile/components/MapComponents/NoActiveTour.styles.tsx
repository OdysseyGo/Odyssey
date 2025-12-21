import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
      backgroundColor: color.background,
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: color.foreground,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      shadowColor: color.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 15,
      color: color.subText,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    browseButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      borderRadius: Spacing.borderRadius,
      gap: Spacing.sm,
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    browseButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: color.white,
    },
    hintContainer: {
      position: 'absolute',
      bottom: 100,
      left: Spacing.xl,
      right: Spacing.xl,
      alignItems: 'center',
    },
    hintText: {
      fontSize: 13,
      color: color.subText,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
}
