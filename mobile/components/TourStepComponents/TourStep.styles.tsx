import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
    },

    storyContainer: {
      paddingHorizontal: Spacing.md,
    },

    storyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    storyDescription: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    storyImagesContainer: {
      marginBottom: Spacing.md,
    },
    storyImage: {
      width: '100%',
      height: 150,
      borderRadius: Spacing.borderRadius,
      marginBottom: Spacing.sm,
    },

    puzzleContainer: {
      paddingHorizontal: Spacing.md,
    },

    puzzleTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    puzzleTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      flex: 1,
    },
    puzzleDescription: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
      marginBottom: Spacing.md,
    },
    puzzleIcon: {
      fontSize: 18,
      fontWeight: '700',
      color: color.subText,
    },
    puzzleQuestion: {
      fontSize: 16,
      color: color.text,
      fontWeight: '500',
      marginBottom: Spacing.md,
    },
    puzzleImage: {
      width: '100%',
      height: 120,
      borderRadius: Spacing.borderRadius,
      marginBottom: Spacing.md,
    },
    referenceImageButton: {
      marginBottom: Spacing.md,
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
    },
    referenceImagePreview: {
      width: '100%',
      aspectRatio: 1,
    },
    referenceImageMissing: {
      width: '100%',
      aspectRatio: 1,
      marginBottom: Spacing.md,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.foregroundSecondary,
      padding: Spacing.md,
    },
    referenceImageMissingText: {
      color: color.subText,
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
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
    sectionLabel: {
      fontSize: 12,
      color: color.subText,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    captureButton: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.primary,
      marginTop: Spacing.xs,
    },
    captureButtonDisabled: {
      opacity: 0.6,
    },
    captureButtonText: {
      color: color.white,
      fontWeight: '700',
      fontSize: 14,
    },
    viewPuzzleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.primary,
      marginBottom: Spacing.sm,
    },
    viewPuzzleButtonText: {
      color: color.white,
      fontWeight: '700',
      fontSize: 14,
    },
    secretCodeInput: {
      height: 44,
      borderRadius: Spacing.borderRadius,
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.background,
      color: color.text,
      paddingHorizontal: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    feedbackText: {
      marginTop: Spacing.sm,
      color: color.subText,
      fontSize: 13,
      lineHeight: 18,
    },
    gemPuzzleFrame: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.md,
      minHeight: 460,
      borderRadius: Spacing.borderRadius * 2,
      backgroundColor: '#050509',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xl,
      overflow: 'hidden',
    },
    gemTitle: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 28,
    },
    gemStage: {
      width: 310,
      height: 310,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    gemStatus: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 28,
    },
    gemInstruction: {
      color: 'rgba(255,255,255,0.68)',
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      marginTop: 10,
      maxWidth: 300,
    },

    optionsContainer: {
      gap: Spacing.sm,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foregroundSecondary,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    optionButtonSelected: {
      borderColor: color.primary,
      backgroundColor: color.foreground,
    },
    optionButtonCorrect: {
      borderColor: color.secondary,
      backgroundColor: color.correctOptionBackground,
    },
    optionButtonIncorrect: {
      borderColor: color.error,
      backgroundColor: color.error,
    },
    optionText: {
      fontSize: 14,
      color: color.text,
      flex: 1,
    },
    optionIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: color.subText,
      marginRight: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIndicatorSelected: {
      borderColor: color.primary,
      backgroundColor: color.primary,
    },
  });
}
