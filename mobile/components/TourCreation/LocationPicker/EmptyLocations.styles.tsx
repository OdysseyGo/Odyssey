import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const emptyLocationsStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    emptyLocations: {
      alignItems: 'center',
      padding: Spacing.xl,
    },
    emptyLocationsText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      marginTop: Spacing.md,
    },
  });
};
