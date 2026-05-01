import { StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { ThemeName } from '../../constants/Colors';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: { flex: 1 },
    map: { ...StyleSheet.absoluteFillObject },
    topOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start' },
    topBar: {
      margin: Spacing.md,
      padding: Spacing.md,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foreground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: color.text, fontWeight: '600', fontSize: 18 },
    button: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Spacing.sm,
      backgroundColor: color.foregroundSecondary,
    },
    buttonText: { fontWeight: '500' },

    // Search Here — top-left floating pill
    searchHereButton: {
      position: 'absolute',
      top: 56,
      left: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: color.cardSurface,
      borderRadius: Spacing.borderRadiusFull,
      paddingHorizontal: 16,
      paddingVertical: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
      elevation: 6,
    },
    searchHereText: {
      fontSize: 13,
      fontWeight: '700',
      color: color.primary,
    },
    searchHereButtonDisabled: {
      backgroundColor: color.foreground,
      shadowOpacity: 0.06,
    },
    searchHereTextDisabled: {
      color: color.subText,
    },

    // Results bar — collapsed peek at the bottom
    resultsBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: color.cardSurface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 28,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 10,
    },
    resultsBarHandle: {
      width: 36,
      height: 4,
      backgroundColor: color.borderLight,
      borderRadius: Spacing.borderRadiusFull,
      marginTop: 10,
      marginBottom: 10,
    },
    resultsBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
    },
    resultsBarIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    resultsBarText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '700',
      color: color.text,
    },
    resultsBarSubText: {
      fontSize: 12,
      color: color.subText,
      marginTop: 1,
    },
  });
}
