export type PuzzleType = 'TRIVIA' | 'AR' | 'GYROSCOPE' | 'PICTURE_COMPARE';

export type ARAnchorPosition = {
  x: number;
  y: number;
  z: number;
};

export type ARPuzzleConfig = {
  modelId: number;
  modelSlug: string;
  modelName: string;
  previewImageUrl: string;
  sceneAssetUrl: string;
  modelScaleMeters: number;
  secretCode: string;
  placementMode: 'anchor';
  anchorId: string;
  anchorLabel: string;
  anchorPosition: ARAnchorPosition;
};

export interface Puzzle {
  puzzle_type: PuzzleType;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  xp_reward: number;
  referenceImage?: string;
  arConfig?: ARPuzzleConfig;
}

export const PUZZLE_TYPE_OPTIONS = [
  { value: 'TRIVIA', label: 'Trivia', description: 'Multiple choice question' },
  { value: 'AR', label: 'AR Challenge', description: 'Augmented reality experience' },
  { value: 'GYROSCOPE', label: 'Gyroscope', description: 'Motion-based challenge' },
  {
    value: 'PICTURE_COMPARE',
    label: 'Picture Compare',
    description: 'Match a reference photo in real life',
  },
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
  country: string;
  countryCode: string;
  city: string;
  cityLatitude?: number;
  cityLongitude?: number;
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
  country: '',
  countryCode: '',
  city: '',
  cityLatitude: undefined,
  cityLongitude: undefined,
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

export const isPuzzleValid = (puzzle?: Puzzle): boolean => {
  if (!puzzle?.question.trim()) {
    return false;
  }

  if (puzzle.puzzle_type === 'PICTURE_COMPARE') {
    return !!puzzle.referenceImage;
  }

  if (puzzle.puzzle_type === 'TRIVIA') {
    const options = puzzle.options.map((option) => option.trim()).filter(Boolean);
    return options.length >= 2 && options.includes(puzzle.correctAnswer.trim());
  }

  return true;
};

export const doesLocationMeetTourRequirements = (
  location: Pick<TourLocation, 'title' | 'story' | 'puzzle'>,
  tourType: TourCreationData['tourType']
): boolean => {
  const hasCoreContent = location.title.trim().length > 0 && location.story.trim().length > 0;

  if (!hasCoreContent) {
    return false;
  }

  if (tourType === 'PUZZLE') {
    return isPuzzleValid(location.puzzle);
  }

  if (tourType === 'HYBRID') {
    return !location.puzzle || isPuzzleValid(location.puzzle);
  }

  return true;
};
