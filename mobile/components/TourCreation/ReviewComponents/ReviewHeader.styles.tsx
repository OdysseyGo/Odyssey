import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const reviewHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginBottom: Spacing.lg,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    subtitle: {
      fontSize: 14,
      color: color.subText,
    },
  });
};
