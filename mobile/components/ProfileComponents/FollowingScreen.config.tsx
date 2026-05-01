import Colors from '@/constants/Colors';
import { User } from '@/api/users';

export type FollowingUserRowProps = {
  item: User;
  theme: (typeof Colors)['light'];
  isOwnProfile: boolean;
  isFollowingItem: boolean;
  currentUserId: number | null;
  onUnfollow: (id: number) => void;
  unfollowing: boolean;
  onFollow: (id: number) => void;
  actionLoadingId: number | null;
};
