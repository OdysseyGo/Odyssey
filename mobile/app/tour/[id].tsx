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
import { useTranslation } from 'react-i18next';

export default function TourDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tour, loading, error, fetchTour } = useTourDetailScreen(id || '');
  const { startTour } = useActiveTour();
  const { t } = useTranslation();

  const handleStartTour = async () => {
    console.log('Starting tour:', id);

    // Check if user is logged in
    const loggedIn = await isLoggedIn();
    if (!loggedIn) {
      Alert.alert(
        t('tourId.loginRequired'),
        t('tourId.loginRequiredMessage'),
        [
          { text: t('tourId.cancel'), style: 'cancel' },
          { text: t('tourId.login'), onPress: () => router.push('/login') },
        ]
      );
      return;
    }

    try {
      // Fetch fresh tour data with steps and puzzles
      if (id) {
        const tourData = await getTour(parseInt(id, 10));
        console.log('Tour data:', tourData);

        // Start the tour in context (this will map API data to internal format)
        startTour(tourData);
        // Navigate to the map tab
        router.replace('/(tabs)/map');
      }
    } catch (err) {
      console.error('Failed to start tour:', err);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: t('tourId.loading') }} />
        <TourDetailScreenLoading />
      </>
    );
  }

  if (error || !tour) {
    return (
      <>
        <Stack.Screen options={{ title: t('tourId.error') }} />
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
