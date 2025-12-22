import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const loadingOverlayStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 100,
    },
    content: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.xxl,
      alignItems: 'center',
      maxWidth: 300,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: color.text,
      marginTop: Spacing.lg,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: color.subText,
      marginTop: Spacing.sm,
      textAlign: 'center',
    },
  });
};
