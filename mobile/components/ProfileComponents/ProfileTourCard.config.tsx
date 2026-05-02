import { ViewStyle } from 'react-native';
import { Tour, TourReviewStatus, TourStatus } from '@/api/tours';

export interface ProfileTourCardProps {
  tour: Tour;
  onPress?: () => void;
  containerStyle?: ViewStyle;
}

export const STATUS_COLORS: Record<TourStatus, { bg: string; text: string }> = {
  PUBLISHED: { bg: '#22c55e', text: '#ffffff' },
  PENDING: { bg: '#0284C7', text: '#ffffff' },
  ARCHIVED: { bg: '#6b7280', text: '#ffffff' },
};

export const STATUS_LABELS: Record<TourStatus, string> = {
  PUBLISHED: 'Published',
  PENDING: 'Pending',
  ARCHIVED: 'Archived',
};

export const REVIEW_STATUS_PILL_LABELS: Record<TourReviewStatus, string> = {
  IN_REVIEW: 'review',
  REJECTED: 'rejected',
};

export const REVIEW_STATUS_PILL_COLORS: Record<
  TourReviewStatus,
  { bg: string; border: string; text: string }
> = {
  IN_REVIEW: {
    bg: '#FEF3C7',
    border: '#F59E0B',
    text: '#92400E',
  },
  REJECTED: {
    bg: '#FEE2E2',
    border: '#EF4444',
    text: '#B91C1C',
  },
};
