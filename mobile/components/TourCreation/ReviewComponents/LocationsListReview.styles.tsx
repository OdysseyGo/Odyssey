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
      fontWeight: '800',
      color: color.text,
      marginBottom: Spacing.md,
    },
    locationCard: {
      backgroundColor: color.cardSurface,
      borderRadius: 8,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: color.borderLight,
    },
    locationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    locationOrderBadge: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: color.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    locationOrder: {
      fontSize: 14,
      fontWeight: '800',
      color: color.white,
    },
    locationTitleWrap: {
      flex: 1,
      minWidth: 0,
    },
    locationTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: color.text,
    },
    locationMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: Spacing.xs,
      gap: Spacing.xs,
    },
    locationMetaIcon: {
      color: color.primary,
    },
    locationMetaText: {
      fontSize: 12,
      color: color.subText,
      fontWeight: '600',
    },
    locationStory: {
      fontSize: 13,
      color: color.subText,
      lineHeight: 18,
    },
  });
};
