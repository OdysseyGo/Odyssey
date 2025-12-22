import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileTourCardStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      backgroundColor: color.secondary,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardPressed: {
      opacity: 0.7,
    },
    infoContainer: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: color.text,
      flex: 1,
    },
    statusBadge: {
      paddingVertical: 2,
      paddingHorizontal: Spacing.sm,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '600',
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
    arrowContainer: {
      marginLeft: Spacing.sm,
    },
  });
};
