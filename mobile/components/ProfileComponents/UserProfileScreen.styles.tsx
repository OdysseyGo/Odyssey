import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const userProfileStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: color.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: color.white,
      textAlign: 'center',
      flex: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    errorText: {
      fontSize: 15,
      textAlign: 'center',
      color: color.subText,
    },
    content: {
      paddingTop: Spacing.xl,
      gap: Spacing.lg,
    },
    avatarSection: {
      alignItems: 'center',
      gap: Spacing.sm,
      paddingHorizontal: Spacing.xl,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
    },
    avatarImage: {
      overflow: 'hidden',
    },
    avatarPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInitial: {
      fontSize: 36,
      fontWeight: '800',
      color: '#fff',
    },
    fullName: {
      fontSize: 20,
      fontWeight: '700',
      marginTop: Spacing.xs,
      color: color.text,
    },
    country: {
      fontSize: 13,
      color: color.subText,
    },
    followButton: {
      marginTop: Spacing.sm,
      paddingHorizontal: Spacing.xl,
      paddingVertical: 11,
      borderRadius: 999,
      minWidth: 130,
      alignItems: 'center',
    },
    followButtonText: {
      fontSize: 15,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      marginHorizontal: Spacing.lg,
      borderRadius: 18,
      paddingVertical: Spacing.md,
      backgroundColor: color.foreground,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      paddingVertical: Spacing.sm,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '800',
      color: color.text,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: color.subText,
    },
    statDivider: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: color.borderLight,
    },
  });
};
