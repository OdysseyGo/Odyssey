import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const authLayoutStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      backgroundColor: color.foreground,
      justifyContent: 'center',
    },
    headerContainer: {
      marginBottom: Spacing.xl,
      alignItems: 'center',
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
      paddingHorizontal: Spacing.xl,
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
