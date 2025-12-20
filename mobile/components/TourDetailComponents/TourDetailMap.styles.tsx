import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailMapStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      color: color.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: Spacing.md,
    },
    mapContainer: {
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
    },
  });
};
