import Colors from '@/constants/Colors';
import { FeedItem } from '@/api/users';
import { followingFeedStyles } from './following-feed.styles';
import { TFunction } from 'i18next';

export type FeedCardProps = {
  item: FeedItem;
  styles: ReturnType<typeof followingFeedStyles>;
  color: (typeof Colors)['light'];
  t: TFunction;
};
