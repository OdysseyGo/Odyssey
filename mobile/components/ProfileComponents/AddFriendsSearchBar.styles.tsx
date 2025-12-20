import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsSearchBarStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginBottom: Spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.lg,
      borderWidth: 2,
      minHeight: 52,
    },
    searchContainerFocused: {
      backgroundColor: color.background,
      borderColor: color.primary,
    },
    searchContainerBlurred: {
      backgroundColor: color.foregroundSecondary,
      borderColor: 'transparent',
    },
    input: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.md,
      fontSize: 15,
      color: color.text,
      fontWeight: '500',
    },
    clearButton: {
      padding: Spacing.sm,
    },
  });
};
