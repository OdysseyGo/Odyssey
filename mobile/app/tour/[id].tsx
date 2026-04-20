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
import { checkTourAccess, unlockTour } from '@/api/payments';
import { useTranslation } from 'react-i18next';

import { createTourProgress, getInProgressTour } from '@/api/tourProgress';

export default function TourDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tour, loading, error, fetchTour } = useTourDetailScreen(id || '');
  const { startTour } = useActiveTour();
  const { t } = useTranslation();
  const [starting, setStarting] = useState(false);

  const handleStartTour = async () => {
    if (starting) return;

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

    if (!id) return;
    const tourId = parseInt(id, 10);
    setStarting(true);
    try {
      // Check access for paid tours
      if (tour && tour.creditPrice > 0) {
        const access = await checkTourAccess(tourId);
        if (!access.has_access) {
          setStarting(false);
          Alert.alert(
            t('tourId.unlockTitle'),
            t('tourId.unlockMessage', { count: access.credit_price }),
            [
              { text: t('tourId.cancel'), style: 'cancel' },
              {
                text: t('tourId.unlockButton', { count: access.credit_price }),
                onPress: async () => {
                  setStarting(true);
                  try {
                    await unlockTour(tourId);
                    Alert.alert(t('tourId.unlockedTitle'), t('tourId.unlockedMessage'), [
                      {
                        text: t('tourId.ok'),
                        onPress: async () => {
                          try {
                            const tourData = await getTour(tourId);
                            const progressResponse = await createTourProgress({ tour_id: tourId });
                            startTour(tourData, progressResponse.id);
                            router.replace('/(tabs)/map');
                          } catch {
                            setStarting(false);
                          }
                        },
                      },
                    ]);
                  } catch (err: any) {
                    setStarting(false);
                    Alert.alert(
                      t('tourId.unlockFailTitle'),
                      err?.response?.data?.error ||
                        err?.response?.data?.detail ||
                        err?.message ||
                        t('tourId.unlockFailMessage')
                    );
                  }
                },
              },
            ]
          );
          return;
        }
      }
      // Free tour or already has access — start directly
      const tourData = await getTour(tourId);
      const progressResponse = await createTourProgress({ tour_id: tourId });
      startTour(tourData, progressResponse.id);
      router.replace('/(tabs)/map');
    } catch (err: any) {
      setStarting(false);
      console.error('Failed to start tour:', err);

      // Check if the backend blocked us because a tour is already active
      if (err.response?.data?.active_tour_id) {
        Alert.alert(t('tourId.tourInProgressTitle'), t('tourId.tourInProgressMessage'));
      } else {
        Alert.alert(t('tourId.errorTitle'), t('tourId.errorMessage'));
      }
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
