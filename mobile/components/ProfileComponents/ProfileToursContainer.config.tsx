import { TourStatus } from '@/api/tours';

export interface ProfileToursContainerProps {
  userId?: number;
}

export type TourTab = {
  key: TourStatus;
  label: string;
};

export const TOUR_TABS: TourTab[] = [
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'DRAFT', label: 'Drafts' },
  { key: 'ARCHIVED', label: 'Archived' },
];
