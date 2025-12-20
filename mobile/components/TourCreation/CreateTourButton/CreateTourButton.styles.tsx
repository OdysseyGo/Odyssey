import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: screenWidth } = Dimensions.get('window');

export const createTourButtonStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    floatingButton: {
      position: 'absolute',
      bottom: Spacing.xl,
      right: Spacing.xl,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },
    buttonPressed: {
      opacity: 0.8,
      transform: [{ scale: 0.95 }],
    },
  });
};
