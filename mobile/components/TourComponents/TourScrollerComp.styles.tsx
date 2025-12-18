import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourScrollerCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginTop: Spacing.md,
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    headerTitle: {
      width: '100%',
      backgroundColor: 'transparent',
      height: 40,
      justifyContent: 'center',
      padding: Spacing.md,
    },
    title: {
      color: color.text,
      fontSize: 18,
      fontWeight: '600',
    },
    listContent: {
      paddingHorizontal: Spacing.md,
    },
    separator: {
      width: Spacing.md,
    },
  });
};
