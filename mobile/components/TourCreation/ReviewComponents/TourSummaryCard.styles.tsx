import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourSummaryCardStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primaryMuted,
    },
    icon: {
      color: color.primary,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: color.text,
      flex: 1,
      minWidth: 0,
    },
    description: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 21,
      marginTop: Spacing.md,
    },
  });
};
