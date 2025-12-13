import { StyleSheet, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: screenWidth } = Dimensions.get('window');
const contentWidth = screenWidth * 0.85;
const maxContentWidth = 400;

export const authLayoutStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: color.foreground,
    },
    container: {
      flexGrow: 1,
      backgroundColor: color.foreground,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: Spacing.xl,
    },
    contentWrapper: {
      width: Math.min(contentWidth, maxContentWidth),
      alignItems: 'center',
    },
    headerContainer: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
      width: '100%',
    },
    headerTitle: {
      textAlign: 'center',
      fontSize: 32,
      fontWeight: '800',
      marginBottom: Spacing.xs,
      color: color.primary,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      textShadowColor: color.textShadowColor,
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
    },
    headerSubtitle: {
      fontSize: 14,
      color: color.subText,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: Spacing.lg,
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      marginBottom: Spacing.sm,
      color: color.error,
      textAlign: 'center',
    },
    footerContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: Spacing.md,
    },
    footerMessage: {
      fontSize: 14,
      color: color.subText,
    },
    footerLink: {
      fontSize: 14,
      fontWeight: '600',
      color: color.primary,
    },
  });
};
