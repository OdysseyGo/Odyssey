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
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: '#fff',
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 13,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
  });
};
