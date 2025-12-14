import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsModalProTipStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      backgroundColor: color.background,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: color.primary,
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    iconContainer: {
      marginRight: Spacing.md,
      marginTop: Spacing.xs,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 13,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    description: {
      fontSize: 12,
      color: color.subText,
      lineHeight: 18,
    },
  });
};
