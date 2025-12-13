import { BadgeType } from './ProfileBadges.config';

export type ProfileBadgesContainerProps = {
  badges?: BadgeType[];
  title?: string;
  showAll?: boolean;
  maxDisplay?: number;
};

export const exampleProfileBadgesContainer: ProfileBadgesContainerProps = {
  badges: [
    {
      id: '1',
      name: 'Explorer',
      icon: '🌍',
      description: 'Completed 5 tours',
      unlocked: true,
      earnedDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Social Butterfly',
      icon: '🦋',
      description: 'Added 10 friends',
      unlocked: true,
      earnedDate: '2024-02-20',
    },
    {
      id: '3',
      name: 'Master',
      icon: '👑',
      description: 'Earned 1000 XP',
      unlocked: false,
    },
  ],
  title: 'Badges',
  showAll: false,
  maxDisplay: 3,
};
