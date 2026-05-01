import { markerColors } from '@/constants/Colors';

export type PuzzleType = 'multiple-choice' | 'picture-compare' | 'ar-code' | 'compass-bearing';

export interface MultipleChoiceOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface MultipleChoicePuzzle {
  type: 'multiple-choice';
  question: string;
  options: MultipleChoiceOption[];
  imageUri?: string;
}

export interface PictureComparePuzzle {
  type: 'picture-compare';
  question: string;
  referenceImageUri?: string;
}

export interface ArCodePuzzle {
  type: 'ar-code';
  question: string;
  sceneAssetUrl?: string;
  secretCode?: string;
  anchorPosition?: {
    x: number;
    y: number;
    z: number;
  };
  modelScaleMeters?: number;
}

export interface CompassBearingPuzzle {
  type: 'compass-bearing';
  question: string;
  targetHeadingDegrees: number;
}

export type Puzzle =
  | MultipleChoicePuzzle
  | PictureComparePuzzle
  | ArCodePuzzle
  | CompassBearingPuzzle;

export type TourStepType = 'story' | 'puzzle';

export interface BaseStep {
  id: string;
  title: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  requiresLocationConfirmation?: boolean;
}

export interface StoryStep extends BaseStep {
  type: 'story';
  description: string;
  images?: string[];
}

export interface PuzzleStep extends BaseStep {
  type: 'puzzle';
  puzzle: Puzzle;
  description?: string;
}

export type TourStep = StoryStep | PuzzleStep;

export interface Tour {
  id: string;
  title: string;
  description: string;
  coverImageUri: string;
  hasCompletedOnce?: boolean;
  steps: TourStep[];
}

export interface TourStepProps {
  step: TourStep;
  isSolved: boolean;
  isFinished?: boolean;
  onSolve: () => void;
  onAnswered?: () => void;
}

export const exampleTour: Tour = {
  id: 'tour-1',
  title: 'Historic Istanbul Tour',
  description: 'Explore the historic landmarks of Istanbul',
  coverImageUri: '',
  steps: [
    {
      id: 'step-1',
      type: 'story',
      title: 'Welcome to Istanbul',
      requiresLocationConfirmation: true,
      description:
        'Istanbul is a major city in Turkey that straddles Europe and Asia. Its Old City reflects cultural influences of the many empires that once ruled here.',
      coordinate: {
        latitude: 41.0082,
        longitude: 28.9784,
      },
      images: [],
    },
    {
      id: 'step-2',
      type: 'puzzle',
      title: 'Hagia Sophia Quiz',
      requiresLocationConfirmation: true,
      coordinate: {
        latitude: 41.0086,
        longitude: 28.98,
      },
      puzzle: {
        type: 'multiple-choice',
        question: 'When was Hagia Sophia originally built?',
        imageUri: '',
        options: [
          { id: 'a', text: '325 AD', isCorrect: false },
          { id: 'b', text: '537 AD', isCorrect: true },
          { id: 'c', text: '1453 AD', isCorrect: false },
          { id: 'd', text: '1935 AD', isCorrect: false },
        ],
      },
    },
    {
      id: 'step-4',
      type: 'story',
      title: 'Grand Bazaar',
      requiresLocationConfirmation: true,
      description:
        'The Grand Bazaar is one of the largest and oldest covered markets in the world, with 61 covered streets and over 4,000 shops.',
      coordinate: {
        latitude: 41.0106,
        longitude: 28.968,
      },
      images: [],
    },
  ],
};

export const getMarkerColorForStep = (index: number): string => {
  return markerColors[index % markerColors.length];
};
