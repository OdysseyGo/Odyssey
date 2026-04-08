import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';

export const tourDetailCoverStyles = (theme: ThemeName) => {
  return StyleSheet.create({
    coverContainer: {
      height: 400,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      overflow: 'hidden',
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    backButton: {
      position: 'absolute',
      left: 16,
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
  });
};
