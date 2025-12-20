import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsModalListStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    listContainer: {
      paddingVertical: Spacing.sm,
    },

    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: color.border,
    },

    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },

    avatarPlaceholder: {
      width: Spacing.xl + Spacing.sm,
      height: Spacing.xl + Spacing.sm,
      borderRadius: (Spacing.xl + Spacing.sm) / 2,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },

    username: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
    },

    addButton: {
      width: Spacing.xl + Spacing.sm,
      height: Spacing.xl + Spacing.sm,
      borderRadius: (Spacing.xl + Spacing.sm) / 2,
      backgroundColor: color.background,
      justifyContent: 'center',
      alignItems: 'center',
    },

    emptyText: {
      textAlign: 'center',
      marginTop: Spacing.xl,
      fontSize: 14,
      color: color.text,
    },
  });
};
