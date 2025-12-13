import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailStopsStyles = (theme: ThemeName) => {
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
    stopItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
      marginBottom: Spacing.md,
      padding: Spacing.md,
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
    },
    stopNumber: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stopNumberText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    stopContent: {
      flex: 1,
    },
    stopTitle: {
      color: color.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.xs,
    },
    stopDescription: {
      color: color.subText,
      fontSize: 14,
    },
  });
};
