import { ViewStyle } from 'react-native';
import { Tour, TourReviewStatus, TourStatus } from '@/api/tours';

export interface ProfileTourCardProps {
  tour: Tour;
  onPress?: () => void;
  onEditPress?: () => void;
  containerStyle?: ViewStyle;
}

export const STATUS_COLORS: Record<TourStatus, { bg: string; text: string }> = {
  PUBLISHED: { bg: '#22c55e', text: '#ffffff' },
  PENDING: { bg: '#0284C7', text: '#ffffff' },
  ARCHIVED: { bg: '#6b7280', text: '#ffffff' },
};

export const STATUS_LABELS: Record<TourStatus, string> = {
  PUBLISHED: 'profile.tabs.published',
  PENDING: 'profile.tabs.pending',
  ARCHIVED: 'profile.tabs.archived',
};

export const REVIEW_STATUS_PILL_LABELS: Record<TourReviewStatus, string> = {
  IN_REVIEW: 'creation.reviewStatus.review',
  REJECTED: 'creation.reviewStatus.rejected',
};

export const REVIEW_STATUS_PILL_COLORS: Record<
  TourReviewStatus,
  { bg: string; border: string; text: string }
> = {
  IN_REVIEW: {
    bg: '#FDE047',
    border: '#EAB308',
    text: '#713F12',
  },
  REJECTED: {
    bg: '#F87171',
    border: '#EF4444',
    text: '#7F1D1D',
  },
};
