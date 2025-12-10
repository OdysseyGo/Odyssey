import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { ThemeName } from '../../constants/Colors';

export const BottomSliderStyle = (theme: ThemeName) =>
  StyleSheet.create({
    bottomOverlay: { ...StyleSheet.absoluteFillObject },
    bottomPanel: {
      height: '100%',
      paddingHorizontal: Spacing.md,
      borderRadius: Spacing.md,
      backgroundColor: Colors[theme].foreground,
      overflow: 'hidden',
    },
    panelTitle: { color: Colors[theme].text, fontWeight: '600', marginBottom: Spacing.xs },
    panelText: { color: Colors[theme].text, fontSize: 16 },
  });
