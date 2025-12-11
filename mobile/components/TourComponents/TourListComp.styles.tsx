import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourListCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    card: {
      width: '90%',
      backgroundColor: color.background,
      borderColor: color.secondary,
      borderWidth: 1,
      borderRadius: Spacing.borderRadius,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.lg,
      alignSelf: 'center',
      marginVertical: Spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    left: {
      flex: 1,
    },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: color.primary,
    },

    author: {
      marginTop: Spacing.xs,
      fontSize: 15,
      color: 'color.subText',
    },

    right: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    rating: {
      fontSize: 17,
      fontStyle: 'italic',
      fontWeight: '600',
      color: color.subText,
    },
  });
};
