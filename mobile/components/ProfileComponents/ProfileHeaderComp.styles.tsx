import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileHeaderCompStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      width: '100%',
      paddingTop: '5%',
      paddingBottom: '10%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.background,
    },
    avatarWrapper: {
      marginBottom: Spacing.lg,
    },
    avatarCircle: {
      width: Spacing.xl * 6,
      height: Spacing.xl * 6,
      borderRadius: Spacing.xl * 3,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: 'white',
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontSize: 16,
      color: color.text,
      opacity: 0.9,
    },
    titleWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.sm,
      borderRadius: Spacing.borderRadius,
      width: 'auto',
      backgroundColor: color.secondary,
      marginBottom: Spacing.xs,
    },
  });
};
