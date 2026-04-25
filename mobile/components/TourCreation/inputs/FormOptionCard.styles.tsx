import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formOptionCardStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    optionCard: {
      backgroundColor: color.background,
      borderRadius: 8,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: color.borderLight,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    optionCardSelected: {
      borderColor: color.primary,
      backgroundColor: color.primaryMuted,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: color.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    radioSelected: {
      borderColor: color.primary,
    },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: color.primary,
    },
    optionContent: {
      flex: 1,
      minWidth: 0,
    },
    optionCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.sm,
    },
    optionCardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
    },
    optionCardDescription: {
      fontSize: 12,
      color: color.subText,
      marginTop: Spacing.xs,
      lineHeight: 18,
    },
  });
};
