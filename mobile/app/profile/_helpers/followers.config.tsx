import Colors from '@/constants/Colors';
import { User } from '@/api/users';

export type FollowersUserRowProps = {
  item: User;
  theme: (typeof Colors)['light'];
  onRemove: (id: number) => void;
  removing: boolean;
};
