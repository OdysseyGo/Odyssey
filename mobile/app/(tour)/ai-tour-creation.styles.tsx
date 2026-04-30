import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const aiTourCreationStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: Spacing.xxl,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: color.borderLight,
      marginVertical: Spacing.xl,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: color.text,
      marginBottom: Spacing.sm,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: color.subText,
      marginBottom: Spacing.md,
    },
    arToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: Spacing.md,
    },
    arToggleLabels: {
      flex: 1,
    },
  });
};

// Default export for Expo Router
const AITourCreationStyles = () => null;
export default AITourCreationStyles;
