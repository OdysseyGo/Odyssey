import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { ThemeName } from '../../constants/Colors';

export const MapScreenStyle = (theme: ThemeName) =>
  StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    topOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start' },
    topBar: {
      margin: Spacing.md,
      padding: Spacing.md,
      borderRadius: Spacing.borderRadius,
      backgroundColor: Colors[theme].foreground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: Colors[theme].text, fontWeight: '600', fontSize: 18 },
    button: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.sm,
      backgroundColor: Colors[theme].foregroundSecondary,
    },
    buttonText: { fontWeight: '500' },
  });
