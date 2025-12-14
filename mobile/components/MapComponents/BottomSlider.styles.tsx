import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    bottomOverlay: {
      ...StyleSheet.absoluteFillObject,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    bottomPanel: {
      flex: 1,
      paddingTop: 2,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foreground,
    },
    pressable: {
      width: '100%',
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: Spacing.sm,
    },
    headerTextContainer: {
      flex: 1,
      alignItems: 'center',
    },
    handleBar: {
      width: 40,
      height: Spacing.xs,
      backgroundColor: color.primary,
      borderRadius: Spacing.borderRadius,
      marginBottom: 8,
    },
    panelTitle: {
      color: color.text,
      fontWeight: '600',
      marginBottom: 2,
    },
    panelText: {
      color: color.subText,
      fontSize: 14,
    },
  });
}
