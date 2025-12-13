import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const addFriendsModalStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    container: {
        
      width: '100%',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius * 1.5,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 10,
    },
    contentWrapper: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
  });
};
