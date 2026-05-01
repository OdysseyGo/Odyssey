export type Props = {
  km?: number;
  tours?: number;
  badges?: number;
  followers?: number;
  following?: number;

  // pressable stats for profile
  onToursPress?: () => void;
  onBadgesPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  disableCopilot?: boolean;
};

export const exampleProfileStats: Props = {
  km: 12.3,
  tours: 5,
  badges: 3,
  followers: 100,
  following: 50,
};
