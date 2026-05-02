import React from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourDetailsStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';
import { sanitizeMultiLineText, sanitizeSingleLineText } from '@/utils/inputSanitizers';
import { getTour } from '@/api/tours';
import {
  getApiTourStepIds,
  mapApiTourToCreationData,
} from '@/components/TourCreation/TourCreation.mappers';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourDetailsScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, updateTourData, setTourData, setEditingContext, editingTourId } =
    useTourCreation();
  const { tourId } = useLocalSearchParams<{ tourId?: string }>();
  const { t } = useTranslation();

  const parsedTourId = tourId ? Number(tourId) : null;
  const validTourId = parsedTourId && !Number.isNaN(parsedTourId) ? parsedTourId : null;

  // Initialize loading true when we'll fetch, so we never flash stale context data.
  const [loadingEditTour, setLoadingEditTour] = React.useState(() => validTourId !== null);

  // Stable ref to translator so we can show an error alert without re-running the effect on locale change.
  const tRef = React.useRef(t);
  React.useEffect(() => {
    tRef.current = t;
  }, [t]);

  React.useEffect(() => {
    // Fresh entry to the creation flow: clear any leaked editing context from a prior abandoned edit.
    if (validTourId === null) {
      if (editingTourId !== null) {
        setEditingContext(null, []);
      }
      return;
    }

    let isCancelled = false;

    const loadTourForEditing = async () => {
      setLoadingEditTour(true);
      try {
        const existingTour = await getTour(validTourId);
        if (isCancelled) return;
        setTourData(mapApiTourToCreationData(existingTour));
        setEditingContext(validTourId, getApiTourStepIds(existingTour));
      } catch (error) {
        console.error('Failed to load tour for editing:', error);
        if (!isCancelled) {
          const translate = tRef.current;
          Alert.alert(
            translate('creation.errorTitle'),
            translate('creation.errorMessage'),
            [{ text: translate('creation.ok'), onPress: () => router.back() }],
            { cancelable: false }
          );
        }
      } finally {
        if (!isCancelled) {
          setLoadingEditTour(false);
        }
      }
    };

    loadTourForEditing();

    return () => {
      isCancelled = true;
    };
    // editingTourId is intentionally excluded: we only want to react to the URL param.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validTourId, setTourData, setEditingContext]);

  const canProceed =
    sanitizeSingleLineText(tourData.title).trim().length > 0 &&
    sanitizeMultiLineText(tourData.description).trim().length > 0 &&
    !!tourData.coverImage &&
    tourData.category.length > 0 &&
    tourData.country.trim().length > 0 &&
    tourData.countryCode.trim().length > 0 &&
    tourData.state.trim().length > 0 &&
    Number.isFinite(tourData.stateLatitude) &&
    Number.isFinite(tourData.stateLongitude);

  const handleNext = () => {
    router.push('/tour-locations');
  };

  if (loadingEditTour) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: color.foreground }]}>
        <ActivityIndicator size="small" color={color.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <CreationHeader title={t('creation.details.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={0} />
      <TourDetailsStep tourData={tourData} onUpdate={updateTourData} />
      <CreationFooter
        buttonText={t('creation.continue')}
        onPress={handleNext}
        disabled={!canProceed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
