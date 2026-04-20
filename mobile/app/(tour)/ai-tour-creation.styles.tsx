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
    quotaBanner: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
    },
    quotaBannerError: {
      backgroundColor: color.errorBannerBg,
      borderColor: color.errorBannerBorder,
    },
    quotaBannerWarning: {
      backgroundColor: color.warningBannerBg,
      borderColor: color.warningBannerBorder,
    },
    quotaBannerErrorTitle: {
      fontWeight: '700',
      color: color.error,
      marginBottom: 4,
    },
    quotaBannerErrorText: {
      color: color.error,
      fontSize: 13,
    },
    quotaBannerUpgradeLink: {
      color: color.premium,
      fontWeight: '700',
      marginTop: 6,
      fontSize: 13,
    },
    quotaBannerWarningText: {
      color: color.warningText,
      fontSize: 13,
    },
  });
};

// Default export for Expo Router
const AITourCreationStyles = () => null;
export default AITourCreationStyles;
