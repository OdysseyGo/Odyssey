// app/tour/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  TourDetailScreen,
  TourDetailScreenLoading,
  TourDetailScreenError,
  TourDetailScreenContent,
  useTourDetailScreen,
} from '@/components/TourDetailComponents';

export default function TourDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tour, loading, error, fetchTour } = useTourDetailScreen(id || '');

  const handleStartTour = () => {
    console.log('Starting tour:', id);
    // TODO: Navigate to tour navigation mode
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
