import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const SearchStyles = () => null;

export const searchScreenStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    scrollView: {
      flex: 1,
    },
    resultsContainer: {
      paddingTop: Spacing.md,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    resultsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: color.text,
    },
    resultsCount: {
      fontSize: 14,
      color: color.subText,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
    },
    emptyIcon: {
      marginBottom: Spacing.lg,
      opacity: 0.5,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    emptySubText: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
      paddingHorizontal: Spacing.xl,
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 100,
    },
    loadingText: {
      marginTop: Spacing.md,
      fontSize: 14,
      color: color.subText,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      marginHorizontal: Spacing.md,
      marginBottom: Spacing.md,
      padding: Spacing.md,
    },
    userAvatar: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: color.foregroundSecondary,
      marginRight: Spacing.md,
    },
    userAvatarFallback: {
      width: 54,
      height: 54,
      borderRadius: 27,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primaryMuted,
      marginRight: Spacing.md,
    },
    userInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    userName: {
      fontSize: 16,
      fontWeight: '700',
      color: color.primary,
      marginBottom: 4,
    },
    userFullName: {
      fontSize: 13,
      color: color.subText,
      marginBottom: 4,
    },
    userMeta: {
      fontSize: 12,
      color: color.subText,
    },
  });
};

export default SearchStyles;
