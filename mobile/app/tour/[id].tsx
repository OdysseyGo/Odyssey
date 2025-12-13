// app/tour/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors, { ThemeName } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

import {
  TourDetailCover,
  TourDetailStats,
  TourDetailAuthor,
  TourDetailDescription,
  TourDetailMap,
  TourDetailStops,
  TourDetailBottomBar,
  MOCK_TOUR,
} from '@/components/TourDetailComponents';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useColorTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // TODO: Fetch tour data from API using the id
  const tour = MOCK_TOUR;

  const handleStartTour = () => {
    console.log('Starting tour:', id);
    // TODO: Navigate to tour navigation mode
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: tour.title,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TourDetailCover
          coverImage={tour.coverImage}
          title={tour.title}
          rating={tour.rating}
          reviewCount={tour.reviewCount}
        />

        <View style={styles.content}>
          <TourDetailStats
            duration={tour.duration}
            distance={tour.distance}
            difficulty={tour.difficulty}
          />

          <TourDetailAuthor
            authorAvatar={tour.authorAvatar}
            authorName={tour.author}
          />

          <TourDetailDescription
            description={tour.description}
            tags={tour.tags}
          />

          <TourDetailMap stops={tour.stops} />

          <TourDetailStops stops={tour.stops} />

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <TourDetailBottomBar onStartTour={handleStartTour} />
    </>
  );
}

const createStyles = (theme: ThemeName) => {
  const color = Colors[theme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: color.background,
    },
    content: {
      padding: Spacing.lg,
    },
  });
};
