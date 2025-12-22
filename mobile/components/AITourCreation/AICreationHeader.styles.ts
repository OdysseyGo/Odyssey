import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const aiCreationHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
    },
    iconContainer: {
      marginBottom: Spacing.lg,
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: color.foregroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: color.text,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: color.subText,
      lineHeight: 22,
      textAlign: 'center',
    },
  });
};
