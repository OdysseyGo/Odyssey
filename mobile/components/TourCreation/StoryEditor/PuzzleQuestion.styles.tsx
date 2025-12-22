import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const puzzleQuestionStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      gap: Spacing.sm,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: Spacing.xs,
      color: color.text,
    },
  });
};
