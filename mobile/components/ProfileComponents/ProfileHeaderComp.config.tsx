import { Animated } from 'react-native';

export type ProfileHeaderProps = {
  title?: string;
  subtitle?: string;
  avatarUrl?: string;
  onAvatarPress?: () => void;
  onSettingsPress?: () => void;
  settingsAccessibilityLabel?: string;
  scrollY?: Animated.Value;
  level?: number;
  levelTitle?: string;
  xpProgressPercent?: number;
  currentXp?: number;
  xpForCurrentLevel?: number;
  xpForNextLevel?: number;
};

export const exampleProfileHeader: ProfileHeaderProps = {
  title: 'John Doe',
  subtitle: 'Travel Enthusiast',
};
