// app/tour/[id].tsx
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Alert } from 'react-native';
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

export default function TourDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tour, loading, error, fetchTour } = useTourDetailScreen(id || '');
  const { startTour } = useActiveTour();

  const handleStartTour = async () => {
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      Alert.alert(
        'Login Required',
        'You need to be logged in to start a tour. Please log in and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    if (!id) return;
    const tourId = parseInt(id, 10);

    try {
      // Check access for paid tours
      if (tour && tour.creditPrice > 0) {
        const access = await checkTourAccess(tourId);
        if (!access.has_access) {
          Alert.alert(
            'Unlock Tour',
            `This tour costs ${access.credit_price} credits. Do you want to unlock it?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: `Unlock (${access.credit_price} credits)`,
                onPress: async () => {
                  try {
                    await unlockTour(tourId);
                    Alert.alert('Unlocked!', 'Tour unlocked. Starting now...', [
                      {
                        text: 'OK',
                        onPress: async () => {
                          const tourData = await getTour(tourId);
                          startTour(tourData);
                          router.replace('/(tabs)/map');
                        },
                      },
                    ]);
                  } catch (err: any) {
                    Alert.alert(
                      'Failed to unlock',
                      err?.response?.data?.error ||
                        err?.response?.data?.detail ||
                        err?.message ||
                        'Could not unlock this tour.'
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
      startTour(tourData);
      router.replace('/(tabs)/map');
    } catch (err) {
      console.error('Failed to start tour:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <TourDetailScreenLoading />
      </>
    );
  }

  if (error || !tour) {
    return (
      <>
        <Stack.Screen options={{ title: 'Error' }} />
        <TourDetailScreenError error={error || 'Tour not found'} onRetry={fetchTour} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: tour.title }} />
      <TourDetailScreenContent tour={tour} onStartTour={handleStartTour} />
    </>
  );
}
