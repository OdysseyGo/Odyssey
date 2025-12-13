import { StyleSheet } from 'react-native';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

export const profileBadgesStyles = (
  theme: ThemeName,
  size: 'small' | 'medium' | 'large' = 'medium'
) => {
  const color = Colors[theme];

  const sizeConfig = {
    small: { iconSize: 32, padding: Spacing.sm },
    medium: { iconSize: 48, padding: Spacing.md },
    large: { iconSize: 64, padding: Spacing.lg },
  };

  const config = sizeConfig[size];

  return StyleSheet.create({
    badgeContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: config.padding,
      borderRadius: Spacing.borderRadius,
      backgroundColor: color.foreground,
      minWidth: config.iconSize + config.padding * 2,
      position: 'relative',
    },
    badgeContainerUnlocked: {
      backgroundColor: color.foregroundSecondary,
      borderWidth: 2,
      borderColor: color.primary,
    },
    badgeContainerLocked: {
      opacity: 0.5,
      backgroundColor: color.foreground,
    },
    badge: {
      fontSize: config.iconSize,
      textAlign: 'center',
    },
    unlockedBadge: {
      textShadowColor: color.primary,
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    nameText: {
      fontSize: 12,
      fontWeight: '600',
      color: color.text,
      marginTop: Spacing.xs,
      textAlign: 'center',
      maxWidth: config.iconSize + config.padding * 2,
    },
    descriptionText: {
      fontSize: 10,
      color: color.subText,
      marginTop: Spacing.xs,
      textAlign: 'center',
      maxWidth: config.iconSize + config.padding * 2,
    },
    lockedOverlay: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: Spacing.borderRadius,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    lockIcon: {
      fontSize: 24,
    },
  });
};
