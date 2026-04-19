import { StyleSheet, Platform, Dimensions } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.md * 2;
const CARD_HEIGHT = 270;

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
      paddingBottom: Spacing.xl,
    },
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
      backgroundColor: color.foregroundSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '80%',
    },
    // Completion badge — top right
    completionBadge: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 5,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 10,
      borderWidth: 0.5,
      borderColor: 'rgba(74,222,128,0.4)',
    },
    completionText: {
      color: '#4ADE80',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    // Duration pill — top left
    durationPill: {
      position: 'absolute',
      top: Spacing.md,
      left: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
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
      gap: 6,
    },
    userAvatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.5)',
      overflow: 'hidden',
    },
    userAvatarText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
    },
    avatarContainer: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,0.18)',
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      resizeMode: 'cover',
    },
    userName: {
      color: color.white,
      fontSize: 13,
      fontWeight: '700',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    tourTitle: {
      color: color.white,
      fontSize: 17,
      fontWeight: '800',
      lineHeight: 23,
      letterSpacing: -0.3,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
      marginBottom: Spacing.xs,
    },
    tourDescription: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
      lineHeight: 17,
      marginBottom: 7,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      marginTop: 4,
    },
    metaTags: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
      flexWrap: 'wrap',
    },
    categoryChip: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 6,
      borderWidth: 0.5,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    categoryChipText: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    difficultyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    difficultyDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
    },
    difficultyChipText: {
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    cityText: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 10,
      fontWeight: '500',
    },
    completedAt: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: 10,
      textAlign: 'right',
      flexShrink: 0,
    },
    empty: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
    },
    emptyText: {
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: Spacing.md,
      color: color.subText,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: Spacing.sm,
      color: color.subText,
      lineHeight: 20,
    },
  });
};
