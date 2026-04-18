import { StyleSheet, Platform, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const CARD_HEIGHT = 220;

export { CARD_WIDTH, CARD_HEIGHT };

export const followingFeedStyles = (theme: ThemeName) => {
  const color = Colors[theme];
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: color.white,
      textAlign: 'center',
      flex: 1,
    },
    list: {
      padding: Spacing.md,
    },
    // Tour card styles adapted from TourDisplayComp
    cardWrapper: {
      width: CARD_WIDTH,
      marginBottom: Spacing.md,
    },
    card: {
      width: '100%',
      height: CARD_HEIGHT,
      borderRadius: 22,
      overflow: 'hidden',
      backgroundColor: color.foreground,
      ...Platform.select({
        ios: {
          shadowColor: isDark ? '#000' : color.text,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.5 : 0.18,
          shadowRadius: 24,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    image: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imagePlaceholder: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: color.foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70%',
    },
    // Completion badge — top right
    completionBadge: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    completionText: {
      color: color.white,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    // Duration pill — top left
    durationPill: {
      position: 'absolute',
      top: Spacing.md,
      left: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 5,
      backgroundColor: color.primary,
      borderRadius: 10,
      ...Platform.select({
        ios: {
          shadowColor: color.primary,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.45,
          shadowRadius: 6,
        },
        android: { elevation: 4 },
      }),
    },
    durationText: {
      color: color.white,
      fontSize: 11,
      fontWeight: '700',
    },
    // Info overlay at bottom
    infoOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: Spacing.md + 2,
      paddingTop: Spacing.lg,
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    userName: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
      marginLeft: Spacing.sm,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    completedText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      marginLeft: Spacing.sm,
    },
    tourTitle: {
      color: color.white,
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 22,
      letterSpacing: -0.2,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      marginBottom: Spacing.xs,
    },
    tourDescription: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
      lineHeight: 18,
      marginBottom: Spacing.sm,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
    },
    metaText: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 11,
      fontWeight: '500',
      flexShrink: 1,
    },
    completedAt: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 10,
      textAlign: 'right',
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
    },
    emptyText: {
      fontSize: 18,
      textAlign: 'center',
      marginTop: Spacing.md,
      color: color.subText,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: Spacing.sm,
      color: color.subText,
    },
  });
};