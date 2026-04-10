import { Animated } from 'react-native';

export type ProfileHeaderProps = {
  title?: string;
  subtitle?: string;
  avatarUrl?: string;
  onAvatarPress?: () => void;
  scrollY?: Animated.Value;
};

export const exampleProfileHeader: ProfileHeaderProps = {
  title: 'John Doe',
  subtitle: 'Travel Enthusiast',
};
