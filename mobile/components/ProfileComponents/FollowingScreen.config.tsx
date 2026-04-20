import Colors from '@/constants/Colors';
import { User } from '@/api/users';

export type FollowingUserRowProps = {
  item: User;
  theme: (typeof Colors)['light'];
  onUnfollow: (id: number) => void;
  unfollowing: boolean;
};
