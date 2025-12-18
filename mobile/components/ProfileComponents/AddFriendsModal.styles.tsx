import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsModalStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: color.background,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    container: {
      width: '100%',
      backgroundColor: color.background,
      borderRadius: Spacing.borderRadius * 1.5,
      overflow: 'hidden',
      shadowColor: color.textShadowColor,
      shadowOffset: { width: 0, height: Spacing.lg },
      shadowOpacity: 0.3,
      shadowRadius: Spacing.xl,
      elevation: 10,
    },
    contentWrapper: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
  });
};
