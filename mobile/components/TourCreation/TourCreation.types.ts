export interface Puzzle {
  question: string;
  answer: string;
  hint: string;
}

export interface TourLocation {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
  story: string;
  order: number;
  image?: string;
  puzzle?: Puzzle;
}

export interface TourCreationData {
  title: string;
  description: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tourType: 'STORY' | 'PUZZLE' | 'HYBRID';
  estimatedDuration: number; // in minutes
  locations: TourLocation[];
  city?: string;
}

export const TOUR_CATEGORIES = [
  'History',
  'Nature',
  'Art',
  'Food',
  'Architecture',
  'Adventure',
  'Culture',
  'Religious',
  'Shopping',
  'Nightlife',
];

export const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy', description: 'Suitable for all ages and fitness levels' },
  { value: 'MEDIUM', label: 'Medium', description: 'Moderate walking, some elevation' },
  { value: 'HARD', label: 'Hard', description: 'Challenging terrain or long distances' },
];

export const TOUR_TYPE_OPTIONS = [
  { value: 'STORY', label: 'Story Mode', description: 'Narrative-driven tour experience' },
  { value: 'PUZZLE', label: 'Puzzle Mode', description: 'Interactive challenges at each stop' },
  { value: 'HYBRID', label: 'Hybrid Mode', description: 'Mix of stories and puzzles' },
];

export const createEmptyTourData = (): TourCreationData => ({
  title: '',
  description: '',
  category: '',
  difficulty: 'MEDIUM',
  tourType: 'STORY',
  estimatedDuration: 60,
  locations: [],
  city: '',
});

export const createNewLocation = (
  latitude: number,
  longitude: number,
  order: number
): TourLocation => ({
  id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  latitude,
  longitude,
  title: '',
  address: '',
  story: '',
  order,
});
