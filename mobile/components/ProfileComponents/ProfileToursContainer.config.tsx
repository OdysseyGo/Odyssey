import { TourStatus } from '@/api/tours';

export interface ProfileToursContainerProps {
  userId?: number;
}

export type TourTab = {
  key: TourStatus;
  label: string;
};

export const TOUR_TABS: TourTab[] = [
  { key: 'PUBLISHED', label: 'profile.tabs.published' },
  { key: 'PENDING', label: 'profile.tabs.pending' },
  { key: 'DRAFT', label: 'profile.tabs.drafts' },
  { key: 'ARCHIVED', label: 'profile.tabs.archived' },
];
