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
      backgroundColor: color.cardSurface,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: color.borderLight,
      shadowColor: color.textShadowColor,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: theme === 'dark' ? 0.28 : 0.1,
      shadowRadius: 18,
      elevation: 8,
    },
    locationsScrollView: {
      padding: Spacing.md,
      backgroundColor: color.background,
    },
  });
};
