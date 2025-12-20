import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const mapContainerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    mapContainer: {
      flex: 1,
    },
    map: {
      width: '100%',
      height: '100%',
    },
  });
};
