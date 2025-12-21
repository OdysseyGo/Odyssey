import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: color.backgroundBlack,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: SCREEN_WIDTH - 48,
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius * 1.5,
      padding: Spacing.xl,
      alignItems: 'center',
      shadowColor: color.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 10,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: color.error + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.lg,
      textAlign: 'center',
      lineHeight: 20,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.star + '20',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    warningText: {
      fontSize: 13,
      color: color.text,
      fontWeight: '500',
    },
    buttonsContainer: {
      width: '100%',
      flexDirection: 'row',
      gap: Spacing.md,
    },
    cancelButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: color.foregroundSecondary,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      gap: Spacing.sm,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
    },
    confirmButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: color.error,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      gap: Spacing.sm,
    },
    confirmButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.white,
    },
    progressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    progressItem: {
      alignItems: 'center',
    },
    progressValue: {
      fontSize: 18,
      fontWeight: '700',
      color: color.primary,
    },
    progressLabel: {
      fontSize: 11,
      color: color.subText,
      textTransform: 'uppercase',
    },
  });
}
