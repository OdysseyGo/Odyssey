import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const routeMapStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      height: 250,
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
    },
    map: {
      flex: 1,
    },
    markerContainer: {
      alignItems: 'center',
    },
    markerCircle: {
      width: Spacing.xxl,
      height: Spacing.xxl,
      borderRadius: Spacing.lg,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: color.white,
      shadowColor: color.text,
      shadowOffset: { width: 0, height: Spacing.xs / 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5,
    },
    markerNumber: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
    },
    calloutContainer: {
      backgroundColor: color.background,
      padding: Spacing.sm,
      borderRadius: Spacing.sm,
      minWidth: 120,
      maxWidth: 200,
    },
    calloutTitle: {
      color: color.text,
      fontSize: 14,
      fontWeight: '600',
      marginBottom: Spacing.xs / 2,
    },
    calloutDescription: {
      color: color.subText,
      fontSize: 12,
    },
  });
};
