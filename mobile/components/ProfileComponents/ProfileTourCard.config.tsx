import { ViewStyle } from 'react-native';
import { Tour, TourStatus } from '@/api/tours';

export interface ProfileTourCardProps {
  tour: Tour;
  onPress?: () => void;
  containerStyle?: ViewStyle;
}

export const STATUS_COLORS: Record<TourStatus, { bg: string; text: string }> = {
  PUBLISHED: { bg: '#22c55e', text: '#ffffff' },
  DRAFT: { bg: '#f59e0b', text: '#ffffff' },
  ARCHIVED: { bg: '#6b7280', text: '#ffffff' },
};

export const STATUS_LABELS: Record<TourStatus, string> = {
  PUBLISHED: 'Published',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
};
