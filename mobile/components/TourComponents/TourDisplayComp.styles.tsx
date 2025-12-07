import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDisplayCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      width: '90%',

      backgroundColor: color.background,
      borderRadius: Spacing.borderRadius,
      overflow: 'hidden',
      alignSelf: 'center',
      marginTop: Spacing.lg,
      borderColor: color.secondary,
      borderWidth: 1,
    },
    image: {
      width: '100%',
      height: 200,
    },
    header: {
      marginTop: Spacing.xs,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    infoContainer: {
      padding: Spacing.lg,
    },
    title: {
      color: color.primary,
      fontSize: 22,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    author: {
      fontSize: 16,
      color: color.subText,
      marginBottom: Spacing.sm,
    },
    rating: {
      fontSize: 16,
      color: color.subText,
      marginBottom: Spacing.sm,
      fontStyle: 'italic',
    },
    metaRow: {
      marginTop: Spacing.xs,
      width: '60%',
      maxWidth: 200,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 14,
      color: color.subText,
    },
  });
};
