export type Props = {
  xp?: number;
  tours?: number;
  badges?: number;
  followers?: number;
  following?: number;

  // pressable stats for profile
  onToursPress?: () => void;
  onBadgesPress?: () => void;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
};

export const exampleProfileStats: Props = {
  xp: 1200,
  tours: 5,
  badges: 3,
  followers: 100,
  following: 50,
};
