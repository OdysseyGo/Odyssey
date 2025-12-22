import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const puzzleOptionsStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    optionsSection: {
      marginTop: Spacing.xs,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.xs,
      color: color.text,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
      gap: Spacing.sm,
    },
    radioButton: {
      padding: Spacing.xs / 2,
    },
    optionInputContainer: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 10,
      backgroundColor: color.foregroundSecondary,
      borderColor: color.border,
    },
    optionInput: {
      fontSize: 16,
      color: color.text,
    },
    removeButton: {
      padding: Spacing.xs / 2,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs / 2,
      gap: Spacing.xs,
      alignSelf: 'flex-start',
      padding: Spacing.xs,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: color.primary,
    },
  });
};
