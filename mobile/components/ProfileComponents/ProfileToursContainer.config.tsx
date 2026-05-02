import { TourStatus } from '@/api/tours';

export interface ProfileToursContainerProps {
  userId?: number;
}

export type ProfileTourTabKey = TourStatus | 'AI';

export type TourTab = {
  key: ProfileTourTabKey;
  label: string;
};

export const TOUR_TABS: TourTab[] = [
  { key: 'PUBLISHED', label: 'profile.tabs.published' },
  { key: 'PENDING', label: 'profile.tabs.pending' },
  { key: 'AI', label: 'profile.tabs.aiTours' },
];
