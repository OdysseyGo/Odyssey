import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailAuthorStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
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
    authorInfo: {
      flex: 1,
    },
    authorLabel: {
      color: color.subText,
      fontSize: 12,
      fontWeight: '500',
      marginBottom: 2,
    },
    authorName: {
      color: color.text,
      fontSize: 16,
      fontWeight: '700',
    },
  });
};
