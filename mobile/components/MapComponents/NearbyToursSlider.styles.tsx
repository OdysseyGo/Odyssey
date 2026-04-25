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
    sheet: {
      flex: 1,
      backgroundColor: color.cardSurface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.14,
      shadowRadius: 16,
      elevation: 18,
      overflow: 'hidden',
    },
    headerPressable: {
      paddingBottom: Spacing.sm,
    },
    handleBar: {
      width: 40,
      height: 4,
      backgroundColor: color.borderLight,
      borderRadius: Spacing.borderRadiusFull,
      alignSelf: 'center',
      marginTop: 10,
      marginBottom: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
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
    headerTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: color.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: color.subText,
      marginTop: 1,
    },
    divider: {
      height: 1,
      backgroundColor: color.borderLight,
      marginTop: Spacing.xs,
      marginHorizontal: Spacing.lg,
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
      borderRadius: 16,
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
    iconBox: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      flex: 1,
      gap: 5,
    },
    cardTitle: {
      fontSize: 15,
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
    chevron: {
      opacity: 0.4,
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
