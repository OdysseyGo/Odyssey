import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formLocationSelectStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      minHeight: 50,
      zIndex: 20,
    },
    autocompleteContainer: {
      flex: 0,
    },
    loadingWrap: {
      height: 50,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.foreground,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: Spacing.borderRadius,
    },
    disabled: {
      opacity: 0.55,
    },
    textInputContainer: {
      minHeight: 50,
      backgroundColor: color.foreground,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    textInput: {
      flex: 1,
      height: 48,
      backgroundColor: color.foreground,
      color: color.text,
      fontSize: 16,
    },
    fallbackInput: {
      height: 50,
      backgroundColor: color.foreground,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      color: color.text,
      fontSize: 16,
      opacity: 0.7,
    },
    errorText: {
      marginTop: Spacing.xs,
      color: color.error,
      fontSize: 12,
    },
    listView: {
      backgroundColor: color.foreground,
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: Spacing.borderRadius,
      marginTop: Spacing.xs,
      overflow: 'hidden',
      zIndex: 30,
    },
    row: {
      backgroundColor: color.foreground,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
    },
    description: {
      color: color.text,
      fontSize: 14,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: color.borderLight,
    },
    poweredContainer: {
      display: 'none',
    },
  });
};
