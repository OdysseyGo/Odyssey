import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    map: {
      ...StyleSheet.absoluteFillObject,
    },
  });
}
