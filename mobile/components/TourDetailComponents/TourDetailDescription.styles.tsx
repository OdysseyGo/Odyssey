import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailDescriptionStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    section: {
      marginBottom: Spacing.xl,
    },
    sectionTitle: {
      color: color.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: Spacing.md,
    },
    description: {
      color: color.subText,
      fontSize: 14,
      lineHeight: 22,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    tag: {
      backgroundColor: color.primary + '20',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: Spacing.xl,
    },
    tagText: {
      color: color.primary,
      fontSize: 12,
      fontWeight: '600',
    },
  });
};
