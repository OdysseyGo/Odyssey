import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const instructionBannerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    instructionBanner: {
      position: 'absolute',
      top: Spacing.md,
      left: Spacing.md,
      right: Spacing.md,
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    instructionText: {
      flex: 1,
      fontSize: 14,
      color: color.subText,
      marginLeft: Spacing.sm,
      lineHeight: 20,
    },
  });
};
