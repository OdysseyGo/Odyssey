// Shared types and mock data for Tour Detail components

import Colors, { ThemeName } from '@/constants/Colors';

export interface TourStop {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  order: number;
}

export interface TourDetail {
  id: string;
  title: string;
  description: string;
  author: string;
  authorId: number;
  authorAvatar: string;
  coverImage: string;
  duration: string;
  distance: string;
  rating: number;
  reviewCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  stops: TourStop[];
  tags: string[];
  elevationGain?: number;
  requiresTransport?: boolean;
  isCircular?: boolean;
  accessibilityRating?: number;
  metricsCalculated?: boolean;
}

export const MOCK_TOUR: TourDetail = {
  id: '1',
  title: 'Historic Istanbul Walking Tour',
  description:
    'Explore the rich history of Istanbul through its most iconic landmarks. This walking tour takes you through centuries of Byzantine and Ottoman heritage, from the majestic Hagia Sophia to the vibrant Grand Bazaar.',
  author: 'Odyssey Travel',
  authorId: 1,
  authorAvatar: 'https://picsum.photos/100/100',
  coverImage: 'https://picsum.photos/800/400',
  duration: '4 hours',
  distance: '5.2 km',
  rating: 4.7,
  reviewCount: 234,
  difficulty: 'Medium',
  stops: [
    {
      id: '1',
      title: 'Hagia Sophia',
      description: 'A masterpiece of Byzantine architecture',
      latitude: 41.0086,
      longitude: 28.9802,
      order: 1,
    },
    {
      id: '2',
      title: 'Blue Mosque',
      description: 'The iconic Sultan Ahmed Mosque',
      latitude: 41.0054,
      longitude: 28.9768,
      order: 2,
    },
    {
      id: '3',
      title: 'Topkapi Palace',
      description: 'Former residence of Ottoman sultans',
      latitude: 41.0115,
      longitude: 28.9833,
      order: 3,
    },
    {
      id: '4',
      title: 'Grand Bazaar',
      description: 'One of the oldest covered markets in the world',
      latitude: 41.0106,
      longitude: 28.9681,
      order: 4,
    },
  ],
  tags: ['History', 'Architecture', 'Walking', 'Culture'],
};

export const getDifficultyColor = (difficulty: TourDetail['difficulty'], theme: ThemeName) => {
  const color = Colors[theme];

  switch (difficulty) {
    case 'Easy':
      return color.easy;
    case 'Medium':
      return color.medium;
    case 'Hard':
      return color.hard;
    default:
      return color.text;
  }
};
