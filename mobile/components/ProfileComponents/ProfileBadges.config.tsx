export type BadgeType = {
  id: string;
  name: string;
  icon: string;
  description?: string;
  unlocked: boolean;
  earnedDate?: string;
};

export type ProfileBadgesProps = {
  badges?: BadgeType[];
  size?: 'small' | 'medium' | 'large';
};

export const exampleProfileBadges: ProfileBadgesProps = {
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
  size: 'medium',
};
