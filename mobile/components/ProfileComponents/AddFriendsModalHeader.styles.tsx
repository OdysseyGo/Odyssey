import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsModalHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      backgroundColor: color.primary,
      paddingVertical: Spacing.xl + Spacing.md,
      paddingHorizontal: Spacing.lg,
      alignItems: 'center',
    },
    iconContainer: {
      width: Spacing.xl + Spacing.lg + Spacing.xs,
      height: Spacing.xl + Spacing.lg + Spacing.xs,
      borderRadius: (Spacing.xl + Spacing.lg + Spacing.xs) / 2,
      backgroundColor: color.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: 'white',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 13,
      color: color.text,
      textAlign: 'center',
    },
  });
};
