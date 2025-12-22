export const TOUR_MODE_OPTIONS = [
  {
    value: 'STORY',
    label: 'Story Mode',
    description: 'Rich narrative-driven tour experience with historical and thematic storytelling',
  },
  {
    value: 'PUZZLE',
    label: 'Puzzle Mode',
    description: 'Interactive challenges and trivia at each location',
  },
  {
    value: 'HYBRID',
    label: 'Hybrid Mode',
    description: 'Best of both - engaging stories with fun puzzles',
  },
] as const;

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
] as const;

export const THEME_SUGGESTIONS = [
  'Haunted History',
  'Hidden Gems',
  'Food & Culture',
  'Art & Architecture',
  'Ancient Mysteries',
  'Local Legends',
] as const;

export type TourMode = 'STORY' | 'PUZZLE' | 'HYBRID';

export type AITourFormData = {
  city: string;
  theme: string;
  mode: TourMode;
  duration: number;
  language: string;
  additionalDetails: string;
};

export const createEmptyFormData = (): AITourFormData => ({
  city: '',
  theme: '',
  mode: 'HYBRID',
  duration: 60,
  language: 'en',
  additionalDetails: '',
});
