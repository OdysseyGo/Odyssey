import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export default function getStyles(theme: ThemeName) {
  const color = Colors[theme];
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheetShadow: {
      flex: 1,
      borderTopLeftRadius: Spacing.xxl,
      borderTopRightRadius: Spacing.xxl,
      shadowColor: color.profileHeaderShadow,
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: theme === 'dark' ? 0.34 : 0.14,
      shadowRadius: 16,
      elevation: 12,
    },
    bottomPanel: {
      flex: 1,
      overflow: 'hidden',
      borderTopLeftRadius: Spacing.xxl,
      borderTopRightRadius: Spacing.xxl,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: color.borderLight,
      backgroundColor: color.cardSurface,
    },
    grabberPressable: {
      width: '100%',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
      alignItems: 'center',
    },
    handleBar: {
      width: 48,
      height: 5,
      backgroundColor: color.primary,
      borderRadius: Spacing.borderRadiusFull,
      marginBottom: Spacing.md,
    },
    sheetHeaderContent: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    headerIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheetHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    sheetEyebrow: {
      color: color.subText,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    sheetTitle: {
      color: color.text,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: color.borderLight,
      marginHorizontal: Spacing.lg,
      marginTop: Spacing.sm,
    },
    list: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: color.foreground,
      borderRadius: Spacing.borderRadius,
      marginTop: Spacing.sm,
      padding: Spacing.md,
      gap: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    cardPressed: {
      opacity: 0.75,
    },
    cardThumbnail: {
      width: 56,
      height: 56,
      borderRadius: 12,
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
      gap: 5,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: color.text,
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 5,
    },
    tag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: Spacing.borderRadiusFull,
      backgroundColor: color.borderLight,
    },
    tagText: {
      fontSize: 11,
      fontWeight: '600',
      color: color.subText,
    },
    difficultyTagText: {
      color: color.white,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
      gap: Spacing.md,
    },
    emptyIconBox: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: color.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: color.text,
    },
    emptySubtitle: {
      fontSize: 13,
      color: color.subText,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: Spacing.lg,
    },
  });
}
