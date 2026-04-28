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
      lineHeight: 20,
      marginBottom: Spacing.lg,
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
    helperState: {
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: 72,
    },
    discoveryContainer: {
      paddingHorizontal: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    discoveryHero: {
      alignItems: 'center',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.borderLight,
    },
    helperIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primaryMuted,
      marginBottom: Spacing.md,
    },
    helperTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: color.text,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    helperSubText: {
      fontSize: 14,
      color: color.subText,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 280,
    },
    suggestionWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.lg,
    },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 38,
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.borderRadiusFull,
      backgroundColor: color.foreground,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: color.borderLight,
    },
    suggestionText: {
      fontSize: 14,
      fontWeight: '700',
      color: color.text,
    },
  });
};

export default SearchStyles;
