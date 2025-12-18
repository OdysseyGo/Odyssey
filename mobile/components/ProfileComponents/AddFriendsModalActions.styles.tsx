import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsModalActionsStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      backgroundColor: color.background,
      borderRadius: Spacing.borderRadius,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButtonText: {
      color: color.text,
      fontWeight: '600',
      fontSize: 14,
    },
  });
};
