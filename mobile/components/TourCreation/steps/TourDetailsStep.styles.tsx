import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const tourDetailsStepStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    content: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.lg,
    },
  });
};
