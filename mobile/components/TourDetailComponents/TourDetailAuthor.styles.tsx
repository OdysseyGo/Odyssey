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
      marginBottom: Spacing.lg,
      padding: Spacing.md,
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
    },
    authorAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    authorLabel: {
      color: color.subText,
      fontSize: 12,
    },
    authorName: {
      color: color.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });
};
