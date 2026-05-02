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
    bannerWrapper: {
      alignItems: 'center',
    },
    banner: {
      width: 48,
      height: 36,
      borderRadius: 6,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: color.background,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.25,
      shadowRadius: 2,
      elevation: 4,
    },
    bannerImage: {
      width: '100%',
      height: '100%',
    },
    typeBadge: {
      position: 'absolute',
      bottom: 3,
      right: 3,
      width: 14,
      height: 14,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: color.background,
    },
    pin: {
      width: 0,
      height: 0,
      borderLeftWidth: 4,
      borderRightWidth: 4,
      borderTopWidth: 5,
      borderLeftColor: 'transparent',
      borderRightColor: 'transparent',
      marginTop: -1,
    },
  });
}
