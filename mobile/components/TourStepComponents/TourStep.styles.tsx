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
    stepScrollContent: {
      paddingBottom: Spacing.lg,
      gap: Spacing.sm,
    },
    stepTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepTypePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: Spacing.xs,
      paddingVertical: 2,
      backgroundColor: 'transparent',
    },
    stepTypeText: {
      color: color.primary,
      fontSize: 12,
      fontWeight: '800',
    },
    puzzleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    puzzleHeaderText: {
      color: color.primary,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 26,
    },
    storyHeroHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    storyHeroHeaderText: {
      color: color.primary,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 26,
    },
    solvedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: Spacing.md,
      backgroundColor: color.primary,
    },
    solvedText: {
      color: color.background,
      fontSize: 12,
      fontWeight: '800',
    },
    contentCard: {
      paddingVertical: Spacing.xs,
    },
    puzzleStoryBlock: {
      gap: Spacing.xs,
      paddingVertical: Spacing.sm,
    },
    storyMiniHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    storyMiniHeaderText: {
      color: color.primary,
      fontSize: 12,
      fontWeight: '800',
      lineHeight: 16,
      textTransform: 'uppercase',
    },

    storyHeader: {
      paddingBottom: Spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: color.borderLight,
    },
    storyTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: color.text,
      lineHeight: 23,
    },
    storyDescription: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 21,
    },
    storyImagesContainer: {
      gap: Spacing.sm,
    },
    storyImage: {
      width: '100%',
      height: 150,
      borderRadius: Spacing.md,
    },

    puzzleContainer: {
      paddingHorizontal: Spacing.md,
    },
    puzzleBody: {
      gap: Spacing.sm,
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
      color: color.text,
      lineHeight: 21,
    },
    puzzleIcon: {
      fontSize: 18,
      fontWeight: '700',
      color: color.subText,
    },
    puzzleQuestion: {
      fontSize: 16,
      color: color.text,
      fontWeight: '700',
      lineHeight: 22,
    },
    questionCard: {
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: color.borderLight,
    },
    questionLabel: {
      color: color.primary,
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      marginBottom: Spacing.xs,
    },
    questionHint: {
      marginTop: Spacing.sm,
      color: color.subText,
      fontSize: 13,
      lineHeight: 19,
    },
    puzzleImage: {
      width: '100%',
      height: 132,
      borderRadius: Spacing.md,
    },
    referenceImageButton: {
      borderRadius: Spacing.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    referenceImagePreview: {
      width: '100%',
      aspectRatio: 1,
    },
    referenceImageMissing: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: Spacing.md,
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
      fontWeight: '800',
      textTransform: 'uppercase',
    },
    captureButton: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 42,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.md,
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
      minHeight: 42,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.md,
      backgroundColor: color.primary,
    },
    viewPuzzleButtonText: {
      color: color.white,
      fontWeight: '700',
      fontSize: 14,
    },
    secretCodeInput: {
      height: 44,
      borderRadius: Spacing.md,
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.foreground,
      color: color.text,
      paddingHorizontal: Spacing.md,
    },
    feedbackText: {
      marginTop: Spacing.sm,
      color: color.subText,
      fontSize: 13,
      lineHeight: 18,
    },
    exhaustedText: {
      color: color.error,
    },
    exhaustedHint: {
      fontSize: 13,
      color: color.subText,
      lineHeight: 18,
      fontStyle: 'italic',
    },
    attemptsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    attemptsLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: color.subText,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginRight: 2,
    },

    optionsContainer: {
      gap: Spacing.sm,
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 50,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.md,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    optionButtonSelected: {
      borderColor: color.primary,
      backgroundColor: color.primaryMuted,
      transform: [{ scale: 0.99 }],
    },
    optionButtonCorrect: {
      borderColor: '#80ED99',
      backgroundColor: '#80ED99',
    },
    optionButtonIncorrect: {
      borderColor: color.error,
      backgroundColor: color.error,
    },
    optionText: {
      fontSize: 14,
      color: color.text,
      flex: 1,
      fontWeight: '600',
      lineHeight: 20,
    },
    optionIndicator: {
      width: 22,
      height: 22,
      borderRadius: Spacing.borderRadiusFull,
      borderWidth: 1,
      borderColor: color.primary,
      marginRight: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    optionIndicatorSelected: {
      borderColor: color.primary,
      backgroundColor: color.primary,
    },
    arActionIndicator: {
      width: 38,
      height: 38,
      borderRadius: Spacing.md,
      borderWidth: 1,
      borderColor: color.primary,
      marginRight: Spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primaryMuted,
    },
  });
}
