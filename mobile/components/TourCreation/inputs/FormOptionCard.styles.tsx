import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formOptionCardStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    optionCard: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      borderWidth: 2,
      borderColor: color.borderLight,
    },
    optionCardSelected: {
      borderColor: color.primary,
    },
    optionCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    },
  });
};
