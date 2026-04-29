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
      lineHeight: 23,
    },
    readMoreButton: {
      marginTop: Spacing.sm,
    },
    readMoreText: {
      color: color.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      backgroundColor: color.primary + '14',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.borderRadiusFull,
      borderWidth: 1,
      borderColor: color.primary + '25',
    },
    tagText: {
      color: color.primary,
      fontSize: 12,
      fontWeight: '600',
    },
  });
};
