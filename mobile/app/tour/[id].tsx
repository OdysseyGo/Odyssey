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

import { createTourProgress, getInProgressTour } from '@/api/tourProgress';
import { useInterstitial } from '@/components/Ads/useInterstitial';

export default function TourDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tour, showAllStops, loading, error, fetchTour } = useTourDetailScreen(id || '');
  const { startTour } = useActiveTour();
  const { t } = useTranslation();
  const [starting, setStarting] = useState(false);
  const tourStartInterstitial = useInterstitial('tour_start_interstitial');

  const handleStartTour = async () => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      Alert.alert(t('tourId.loginRequired'), t('tourId.loginRequiredMessage'), [
        { text: t('tourId.cancel'), style: 'cancel' },
        { text: t('tourId.login'), onPress: () => router.push('/login') },
      ]);
      return;
    }

    // Then check if user has an active tour
    const activeProgress = await getInProgressTour();

    if (activeProgress && activeProgress.id) {
      Alert.alert(
        t('tourId.tourInProgressTitle', 'Tour in Progress'),
        t(
          'tourId.tourInProgressMessage',
          'You already have an active tour! Please finish or quit it before starting a new one.'
        )
      );
      return;
    }

    try {
      if (id) {
        const tourIdNum = parseInt(id, 10);
        const tourData = await getTour(tourIdNum);
        const progressResponse = await createTourProgress({ tour_id: tourIdNum });
        startTour(tourData, progressResponse.id);
        await tourStartInterstitial.show();
        router.replace('/(tabs)/map');
      }
    } catch (err: any) {
      console.error('Failed to start tour:', err);

      // Check if the backend blocked us because a tour is already active
      if (err.response?.data?.active_tour_id) {
        Alert.alert(
          t('tourId.tourInProgressTitle', 'Tour in Progress'),
          t(
            'tourId.tourInProgressMessage',
            'You already have an active tour! Please finish or quit it before starting a new one.'
          )
        );
      } else {
        Alert.alert(
          t('tourId.errorTitle', 'Error'),
          t('tourId.errorMessage', 'Could not start the tour. Please try again.')
        );
      }
    }
  };

  if (loading) {
    return <TourDetailScreenLoading />;
  }

  if (error || !tour) {
    return <TourDetailScreenError error={error || 'Tour not found'} onRetry={fetchTour} />;
  }

  return (
    <TourDetailScreenContent
      tour={tour}
      onStartTour={handleStartTour}
      starting={starting}
      showAllStops={showAllStops}
    />
  );
}
