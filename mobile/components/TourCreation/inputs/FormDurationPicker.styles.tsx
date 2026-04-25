import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formDurationPickerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    durationContainer: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    durationButton: {
      width: 56,
      height: 44,
      borderRadius: 8,
      backgroundColor: color.primaryMuted,
      borderWidth: 1,
      borderColor: color.borderLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    durationValue: {
      fontSize: 24,
      fontWeight: '700',
      color: color.text,
      minWidth: 80,
      textAlign: 'center',
    },
    durationUnit: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
    },
  });
};
