import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailAuthorStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      backgroundColor: color.foreground,
      borderRadius: 16,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
    },
    avatarRing: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: color.primary,
      padding: 2,
    },
    authorAvatar: {
      width: '100%',
      height: '100%',
      borderRadius: 24,
    },
    avatarFallback: {
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    authorInfo: {
      flex: 1,
    },
    authorLabel: {
      color: color.subText,
      fontSize: 11,
      fontWeight: '500',
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    authorName: {
      color: color.text,
      fontSize: 15,
      fontWeight: '700',
    },
    followingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: color.primary,
    },
    followingBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: color.primary,
    },
  });
};
