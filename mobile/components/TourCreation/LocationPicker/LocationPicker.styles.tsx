import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';

export const locationPickerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
  });
};
