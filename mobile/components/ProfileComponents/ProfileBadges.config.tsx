export type BadgeType = {
  id: string;
  name: string;
  code?: string | null;
  description?: string;
  unlocked: boolean;
  city?: string;
  countryCode?: string;
  mistakeCount?: number | null;
  earnedDate?: string;
  sourceTourId?: number;
  sourceTourTitle?: string;
  visualConfig?: Record<string, unknown>;
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
      code: 'CITY_GOLD',
      description: 'Completed 5 tours',
      unlocked: true,
      city: 'Paris',
      countryCode: 'FR',
      earnedDate: '2024-01-15',
    },
    {
      id: '2',
      name: 'Social Butterfly',
      code: 'XP_100',
      description: 'Added 10 friends',
      unlocked: true,
      earnedDate: '2024-02-20',
    },
    {
      id: '3',
      name: 'Master',
      code: 'CITY_BRONZE',
      description: 'Earned 1000 XP',
      unlocked: false,
    },
  ],
  size: 'medium',
};
