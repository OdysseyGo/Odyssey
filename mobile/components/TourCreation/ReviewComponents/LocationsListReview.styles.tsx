import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const locationsListReviewStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      marginTop: Spacing.lg,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.md,
    },
    locationCard: {
      backgroundColor: color.foregroundSecondary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    locationOrder: {
      fontSize: 16,
      fontWeight: '700',
      color: color.primary,
      marginRight: Spacing.sm,
    },
    locationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
      flex: 1,
    },
    locationStory: {
      fontSize: 13,
      color: color.subText,
      lineHeight: 18,
    },
  });
};
