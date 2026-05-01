import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const searchResultStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      overflow: 'hidden',
    },
    image: {
      width: 120,
      height: 100,
    },
    imagePlaceholder: {
      width: 120,
      height: 100,
    },
    infoContainer: {
      flex: 1,
      padding: Spacing.md,
      justifyContent: 'center',
    },
    title: {
      color: color.primary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    author: {
      fontSize: 13,
      color: color.subText,
      marginBottom: Spacing.xs,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    locationText: {
      fontSize: 12,
      color: color.subText,
      marginLeft: Spacing.xs,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    metaText: {
      fontSize: 12,
      color: color.subText,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    star: {
      color: color.star,
      fontSize: 12,
    },
    ratingText: {
      fontSize: 12,
      color: color.subText,
      marginLeft: 2,
    },
  });
};
