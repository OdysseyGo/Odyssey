import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const recentSearchesStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: color.text,
    },
    clearAllText: {
      fontSize: 14,
      color: color.primary,
    },
    searchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: color.foreground,
    },
    searchIcon: {
      marginRight: Spacing.md,
    },
    searchText: {
      flex: 1,
      fontSize: 16,
      color: color.text,
    },
    removeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.xs,
    },
    arrowIcon: {
      opacity: 0.5,
    },
  });
};
