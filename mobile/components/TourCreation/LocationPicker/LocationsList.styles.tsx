import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { height: screenHeight } = Dimensions.get('window');

export const locationsListStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    locationsList: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: screenHeight * 0.35,
      backgroundColor: color.foreground,
      borderTopLeftRadius: Spacing.xl,
      borderTopRightRadius: Spacing.xl,
      shadowColor: color.textShadowColor,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
    locationsScrollView: {
      padding: Spacing.md,
    },
  });
};
