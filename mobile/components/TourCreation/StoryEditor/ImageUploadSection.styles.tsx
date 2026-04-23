import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const imageUploadSectionStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    imageSection: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      gap: Spacing.xs,
    },
    infoButton: {
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
    },
    imagePlaceholder: {
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: color.border,
    },
    imagePlaceholderText: {
      fontSize: 14,
      color: color.subText,
      marginTop: Spacing.sm,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: Spacing.borderRadius,
    },
    referenceImageButton: {
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
    },
    referenceImagePreview: {
      width: '100%',
      aspectRatio: 1,
    },
    referenceImageOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      backgroundColor: 'rgba(0, 0, 0, 0.55)',
    },
    referenceImageOverlayText: {
      fontSize: 12,
      fontWeight: '700',
      color: color.white,
      textAlign: 'center',
    },
    referenceImageModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: Spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    referenceImageModalContent: {
      width: '92%',
      maxHeight: '85%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    referenceImageFull: {
      width: '100%',
      aspectRatio: 1,
    },
    removeImageButton: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: color.error,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};
