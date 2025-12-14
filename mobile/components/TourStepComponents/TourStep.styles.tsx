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
      backgroundColor: color.primary,
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

    triviaInputContainer: {
      marginTop: Spacing.sm,
    },
    triviaInput: {
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      fontSize: 16,
      color: color.text,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    triviaInputCorrect: {
      borderColor: color.success,
    },
    triviaInputIncorrect: {
      borderColor: color.error,
    },
    triviaSubmitButton: {
      marginTop: Spacing.md,
      backgroundColor: color.primary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      alignItems: 'center',
    },
    triviaSubmitButtonDisabled: {
      opacity: 0.5,
    },
    triviaSubmitText: {
      color: color.background,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}
