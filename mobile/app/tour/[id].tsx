// app/tour/[id].tsx
import { useLocalSearchParams, router } from 'expo-router';
import { Alert } from 'react-native';
import { useState } from 'react';
import {
  TourDetailScreen,
  TourDetailScreenLoading,
  TourDetailScreenError,
  TourDetailScreenContent,
  useTourDetailScreen,
} from '@/components/TourDetailComponents';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import { getTour } from '@/api/tours';
import { isLoggedIn } from '@/api/auth';
import { useTranslation } from 'react-i18next';

export default function TourDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tour, loading, error, fetchTour } = useTourDetailScreen(id || '');
  const { startTour } = useActiveTour();
  const { t } = useTranslation();
  const [starting, setStarting] = useState(false);

  const handleStartTour = async () => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      Alert.alert(t('tourId.loginRequired'), t('tourId.loginRequiredMessage'), [
        { text: t('tourId.cancel'), style: 'cancel' },
        { text: t('tourId.login'), onPress: () => router.push('/login') },
      ]);
      return;
    }

    try {
      setStarting(true);
      if (id) {
        const tourData = await getTour(parseInt(id, 10));
        startTour(tourData);
        router.replace('/(tabs)/map');
      }
    } catch (err) {
      console.error('Failed to start tour:', err);
      setStarting(false);
    }
  };

  if (loading) {
    return <TourDetailScreenLoading />;
  }

  if (error || !tour) {
    return <TourDetailScreenError error={error || 'Tour not found'} onRetry={fetchTour} />;
  }

  return <TourDetailScreenContent tour={tour} onStartTour={handleStartTour} starting={starting} />;
}
