import React from 'react';
import { ScrollView } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { TourCreationData } from '../TourCreation.types';
import {
  ReviewHeader,
  TourSummaryCard,
  TourStatsRow,
  TourTagsList,
  LocationsListReview,
} from '../ReviewComponents';
import { tourReviewStepStyles } from './TourReviewStep.styles';
import { useTranslation } from 'react-i18next';

type TourReviewStepProps = {
  tourData: TourCreationData;
};

export default function TourReviewStep({ tourData }: TourReviewStepProps) {
  const theme = useColorTheme();
  const styles = tourReviewStepStyles(theme);
  const { t } = useTranslation();
  // Build tags array with translated tour type, filter out empty values
  const tourTypeKey = tourData.tourType?.toLowerCase();
  const translatedTourType = tourTypeKey
    ? t(`creation.tourType.${tourTypeKey}`, { defaultValue: tourData.tourType })
    : tourData.tourType;
  const tags = [tourData.category, translatedTourType, tourData.city].filter(Boolean) as string[];

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <ReviewHeader title={t('creation.review.title')} subtitle={t('creation.review.subtitle')} />

      <TourSummaryCard
        title={tourData.title || t('creation.review.untitledTour')}
        description={tourData.description || t('creation.review.noDescription')}
      />

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
