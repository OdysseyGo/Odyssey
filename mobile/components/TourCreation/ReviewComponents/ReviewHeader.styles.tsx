import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const reviewHeaderStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      color: color.primary,
    },
    copy: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
    },
  });
};
