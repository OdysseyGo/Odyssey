import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const storyEditorStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.foreground,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      width: '100%',
      padding: Spacing.lg,
    },
  });
};
