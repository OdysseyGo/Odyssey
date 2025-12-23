import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 100,
      right: Spacing.lg,
      zIndex: 1000,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.primary,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      borderRadius: 30,
      shadowColor: color.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8,
      gap: Spacing.sm,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      flex: 1,
      marginRight: Spacing.xs,
    },
    title: {
      fontSize: 14,
      fontWeight: '700',
      color: color.white,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    chevron: {
      marginLeft: Spacing.xs,
    },
    pulseCircle: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: color.star,
      borderWidth: 2,
      borderColor: color.foreground,
    },
  });
}
