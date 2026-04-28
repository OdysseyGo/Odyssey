import { Animated } from 'react-native';

export type ProfileHeaderProps = {
  title?: string;
  subtitle?: string;
  avatarUrl?: string;
  onAvatarPress?: () => void;
  onSettingsPress?: () => void;
  settingsAccessibilityLabel?: string;
  onTutorialsPress?: () => void;
  tutorialsAccessibilityLabel?: string;
  scrollY?: Animated.Value;
  disableCopilot?: boolean;
};

export const exampleProfileHeader: ProfileHeaderProps = {
  title: 'John Doe',
  subtitle: 'Travel Enthusiast',
};
