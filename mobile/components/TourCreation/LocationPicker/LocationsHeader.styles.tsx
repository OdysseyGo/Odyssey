import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationsHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: color.foregroundSecondary,
    },
    locationsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
    },
    locationsCount: {
      fontSize: 14,
      color: color.subText,
    },
  });
};
