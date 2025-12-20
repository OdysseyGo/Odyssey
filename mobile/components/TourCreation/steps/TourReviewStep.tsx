import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { TourCreationData } from '../TourCreation.types';
import {
  ReviewHeader,
  TourSummaryCard,
  TourStatsRow,
  TourTagsList,
  LocationsListReview,
} from '../ReviewComponents';
import { Spacing } from '@/constants/Spacing';

type TourReviewStepProps = {
  tourData: TourCreationData;
};

export default function TourReviewStep({ tourData }: TourReviewStepProps) {
  // Build tags array
  const tags = [tourData.category, tourData.tourType];
  if (tourData.city) {
    tags.push(tourData.city);
  }

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <ReviewHeader
        title="Review Your Tour"
        subtitle="Make sure everything looks good before submitting"
      />

      <TourSummaryCard title={tourData.title} description={tourData.description} />

      <TourStatsRow
        locationCount={tourData.locations.length}
        duration={tourData.estimatedDuration}
        difficulty={tourData.difficulty}
      />

      <TourTagsList tags={tags} />

      <LocationsListReview locations={tourData.locations} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
});
