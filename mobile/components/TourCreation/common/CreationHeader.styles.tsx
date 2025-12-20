import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const creationHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      backgroundColor: color.foreground,
      borderBottomWidth: 1,
      borderBottomColor: color.foregroundSecondary,
    },
    headerButton: {
      padding: Spacing.sm,
      minWidth: 44,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
    },
  });
};
