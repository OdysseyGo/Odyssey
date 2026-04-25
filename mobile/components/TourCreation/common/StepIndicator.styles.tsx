import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const stepIndicatorStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
      backgroundColor: color.foreground,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    progressLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: color.primary,
      textTransform: 'uppercase',
    },
    progressTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: color.subText,
      textTransform: 'capitalize',
    },
    track: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    stepWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    dot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: color.cardSurface,
      borderWidth: 1,
      borderColor: color.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotActive: {
      backgroundColor: color.primary,
      borderColor: color.primary,
    },
    dotCompleted: {
      backgroundColor: color.primary,
      borderColor: color.primary,
    },
    dotText: {
      fontSize: 12,
      fontWeight: '700',
      color: color.subText,
    },
    dotTextActive: {
      color: color.white,
    },
    connector: {
      flex: 1,
      height: 2,
      marginHorizontal: Spacing.xs,
      backgroundColor: color.borderLight,
    },
    connectorCompleted: {
      backgroundColor: color.primary,
    },
  });
};
