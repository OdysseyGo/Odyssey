import React from 'react';
import { View, StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourDetailsStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter, CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';
import { sanitizeMultiLineText, sanitizeSingleLineText } from '@/utils/inputSanitizers';
import { getTour, requestTourDelete } from '@/api/tours';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourDetailsScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, mode, updateTourData, initializeFromExistingTour } = useTourCreation();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ mode?: string; tourId?: string }>();
  const [isBootstrappingEdit, setIsBootstrappingEdit] = React.useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);

  React.useEffect(() => {
    const requestedMode = params.mode;
    const requestedTourId = Number(params.tourId);
    if (requestedMode !== 'edit' || !Number.isFinite(requestedTourId) || requestedTourId <= 0) {
      return;
    }

    let isActive = true;
    const run = async () => {
      setIsBootstrappingEdit(true);
      try {
        const fullTour = await getTour(requestedTourId);
        if (!isActive) return;
        initializeFromExistingTour(fullTour);
      } catch (error) {
        console.error('Failed to preload tour for edit:', error);
        if (isActive) {
          Alert.alert(
            t('creation.errorTitle', { defaultValue: 'Something went wrong' }),
            t('creation.errorMessage', { defaultValue: 'Please try again later.' })
          );
          router.back();
        }
      } finally {
        if (isActive) {
          setIsBootstrappingEdit(false);
          router.setParams({ mode: undefined, tourId: undefined });
        }
      }
    };
    run();
    return () => {
      isActive = false;
    };
  }, [initializeFromExistingTour, params.mode, params.tourId, t]);

  const canProceed =
    sanitizeSingleLineText(tourData.title).trim().length > 0 &&
    sanitizeMultiLineText(tourData.description).trim().length > 0 &&
    !!tourData.coverImage &&
    tourData.category.length > 0 &&
    tourData.country.trim().length > 0 &&
    tourData.countryCode.trim().length > 0 &&
    tourData.state.trim().length > 0 &&
    (mode === 'edit' ||
      (Number.isFinite(tourData.stateLatitude) && Number.isFinite(tourData.stateLongitude)));

  const handleNext = () => {
    router.push('/tour-locations');
  };

  const handleRequestDelete = () => {
    if (!tourData.sourceTourId || isDeleteSubmitting) return;
    Alert.alert(
      t('creation.deleteRequestTitle', { defaultValue: 'Request tour deletion?' }),
      t('creation.deleteRequestMessage', {
        defaultValue: 'Your tour will be hidden and sent to admins for review.',
      }),
      [
        { text: t('creation.cancel', { defaultValue: 'Cancel' }), style: 'cancel' },
        {
          text: t('creation.deleteRequestConfirm', { defaultValue: 'Request Delete' }),
          style: 'destructive',
          onPress: async () => {
            setIsDeleteSubmitting(true);
            try {
              await requestTourDelete(tourData.sourceTourId as number);
              Alert.alert(
                t('creation.underReviewTitle', { defaultValue: 'Your tour is under review' }),
                t('creation.deleteUnderReviewMessage', {
                  defaultValue: 'Delete request submitted. The tour is now pending admin review.',
                }),
                [{ text: t('creation.ok', { defaultValue: 'OK' }), onPress: () => router.dismissAll() }]
              );
            } catch (error) {
              console.error('Delete request failed:', error);
              Alert.alert(
                t('creation.errorTitle', { defaultValue: 'Something went wrong' }),
                t('creation.errorMessage', { defaultValue: 'Please try again later.' })
              );
            } finally {
              setIsDeleteSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <CreationHeader title={t('creation.details.title')} />
      <StepIndicator steps={STEPS} currentStepIndex={0} />
      <TourDetailsStep tourData={tourData} onUpdate={updateTourData} />
      {mode === 'edit' && tourData.sourceTourStatus === 'PUBLISHED' ? (
        <TouchableOpacity
          style={[styles.deleteButton, { borderColor: color.error }]}
          onPress={handleRequestDelete}
          disabled={isDeleteSubmitting || isBootstrappingEdit}
        >
          <Text style={[styles.deleteButtonText, { color: color.error }]}>
            {t('creation.deleteRequestConfirm', { defaultValue: 'Request Delete' })}
          </Text>
        </TouchableOpacity>
      ) : null}
      <CreationFooter
        buttonText={t('creation.continue')}
        onPress={handleNext}
        disabled={!canProceed || isBootstrappingEdit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  deleteButton: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
