import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const formDurationPickerStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    durationContainer: {
      marginTop: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    durationButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: color.foregroundSecondary,
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
