import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { IconType } from './MapMarker.config';

export const getIconName = (iconType: IconType) => {
  switch (iconType) {
    case 'story':
      return 'book-outline';
    case 'puzzle':
      return 'puzzle';
    case 'story-puzzle':
      return 'book-play';
    default:
      return 'book-open-variant';
  }
};

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    circle: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: color.background,
      shadowColor: color.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });
}
