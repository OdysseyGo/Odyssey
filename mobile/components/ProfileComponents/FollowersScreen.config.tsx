import Colors from '@/constants/Colors';
import { User } from '@/api/users';

export type FollowersUserRowProps = {
  item: User;
  theme: (typeof Colors)['light'];
  isOwnProfile: boolean;
  isFollowingItem: boolean;
  currentUserId: number | null;
  onRemove: (id: number) => void;
  removing: boolean;
  onFollow: (id: number) => void;
  onUnfollow: (id: number) => void;
  actionLoadingId: number | null;
};
