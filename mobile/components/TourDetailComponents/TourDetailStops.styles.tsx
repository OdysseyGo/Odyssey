import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailStopsStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    section: {
      marginBottom: Spacing.xl,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    sectionTitle: {
      color: color.text,
      fontSize: 18,
      fontWeight: '700',
    },
    stopCount: {
      color: color.subText,
      fontSize: 13,
      fontWeight: '500',
    },
    stopItem: {
      flexDirection: 'row',
      minHeight: 80,
    },
    // Timeline column
    timelineColumn: {
      width: 40,
      alignItems: 'center',
    },
    stopNumber: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: color.primary,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
    },
    stopNumberFirst: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 3,
      borderColor: color.primary + '30',
    },
    stopNumberText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    connectorLine: {
      flex: 1,
      width: 2,
      backgroundColor: color.primary + '25',
    },
    connectorLineDashed: {
      flex: 1,
      width: 2,
      backgroundColor: color.primary + '15',
    },
    // Content column
    stopContent: {
      flex: 1,
      marginLeft: Spacing.md,
      paddingBottom: Spacing.xl,
    },
    stopContentLast: {
      paddingBottom: Spacing.sm,
    },
    stopCard: {
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      padding: Spacing.md + 2,
      borderLeftWidth: 3,
      borderLeftColor: color.primary + '40',
    },
    stopTitle: {
      color: color.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    stopDescription: {
      color: color.subText,
      fontSize: 13,
      lineHeight: 20,
    },
  });
};
