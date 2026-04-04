import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const avatarSelectionModalStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: color.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '88%',
      maxHeight: '80%',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.lg,
    },
    avatarPreview: {
      width: Spacing.xl * 6,
      height: Spacing.xl * 6,
      borderRadius: Spacing.xl * 3,
      backgroundColor: color.white,
      marginBottom: Spacing.lg,
      overflow: 'hidden',
    },
    avatarImage: {
      width: Spacing.xl * 6,
      height: Spacing.xl * 6,
    },
    seedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
      gap: Spacing.xl,
    },
    arrowButton: {
      width: Spacing.iconButton,
      height: Spacing.iconButton,
      borderRadius: Spacing.iconButton / 2,
      backgroundColor: color.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seedText: {
      fontSize: 16,
      fontWeight: '600',
      color: color.subText,
      minWidth: 60,
      textAlign: 'center',
    },
    styleLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: color.subText,
      marginBottom: Spacing.sm,
    },
    styleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
      gap: Spacing.md,
    },
    styleNameWrapper: {
      backgroundColor: color.foregroundSecondary,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      borderRadius: Spacing.borderRadius,
      minWidth: 140,
      alignItems: 'center',
    },
    styleName: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.sm,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      borderWidth: 1,
      borderColor: color.border,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600',
      color: color.text,
    },
    saveButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.primary,
      alignItems: 'center',
    },
    saveText: {
      fontSize: 15,
      fontWeight: '700',
      color: color.white,
    },
    smallArrow: {
      width: Spacing.iconButtonSmall,
      height: Spacing.iconButtonSmall,
      borderRadius: Spacing.iconButtonSmall / 2,
      backgroundColor: color.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: color.overlayLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
