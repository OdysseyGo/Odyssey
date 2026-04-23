export type PuzzleType = 'TRIVIA' | 'AR' | 'GYROSCOPE';

export interface Puzzle {
  puzzle_type: PuzzleType;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  xp_reward: number;
}

export const PUZZLE_TYPE_OPTIONS = [
  { value: 'TRIVIA', label: 'Trivia', description: 'Multiple choice question' },
  { value: 'AR', label: 'AR Challenge', description: 'Augmented reality experience' },
  { value: 'GYROSCOPE', label: 'Gyroscope', description: 'Motion-based challenge' },
] as const;

export const createEmptyPuzzle = (): Puzzle => ({
  puzzle_type: 'TRIVIA',
  question: '',
  options: ['', ''],
  correctAnswer: '',
  hint: '',
  xp_reward: 10,
});

export interface TourLocation {
  id: string;
  backendStepId?: number;
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
