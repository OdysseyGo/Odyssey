import { View, Text, Pressable, Modal, Alert, Platform } from 'react-native';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

import getStyles from './TourNavigation.styles';
import {
  TourNavigationProps,
  NavigationArrowsProps,
  canNavigateForward,
  canNavigateBackward,
} from './TourNavigation.config';
import TourStepComponent from './TourStep';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { openExternalMapsDirections, type ExternalMapsProvider } from '@/utils/externalMaps';
import { useActiveTour } from '@/contexts/ActiveTourContext';

function NavigationArrows({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  isForwardLocked,
  requiresLocation,
  isLocationConfirmed,
  onLocationConfirm,
  isLastStep,
}: NavigationArrowsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t } = useTranslation();
  const nextButtonIsPrimary = canGoForward && !isForwardLocked;
  const nextContentColor = nextButtonIsPrimary
    ? Colors[theme].background
    : canGoForward
      ? Colors[theme].text
      : Colors[theme].iconDisabled;

  return (
    <View style={styles.navigationContainer}>
      <Pressable
        style={[
          styles.navButton,
          styles.navButtonSecondary,
          !canGoBack && styles.navButtonDisabled,
        ]}
        onPress={onBack}
        disabled={!canGoBack}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={22}
          color={canGoBack ? Colors[theme].iconActive : Colors[theme].iconDisabled}
        />
        <Text style={[styles.navButtonText, !canGoBack && styles.navButtonTextDisabled]}>
          {t('tourStep.back')}
        </Text>
      </Pressable>

      {requiresLocation ? (
        <Pressable
          style={[
            styles.locationButtonCompact,
            isLocationConfirmed && styles.locationButtonConfirmed,
          ]}
          onPress={onLocationConfirm}
          disabled={isLocationConfirmed}
        >
          <MaterialCommunityIcons
            name={isLocationConfirmed ? 'map-marker-check' : 'map-marker-radius'}
            size={20}
            color={isLocationConfirmed ? Colors[theme].background : Colors[theme].icon}
          />
        </Pressable>
      ) : (
        <View style={styles.stepIndicator} />
      )}

      <Pressable
        style={[
          styles.navButton,
          nextButtonIsPrimary && styles.navButtonPrimary,
          !canGoForward && styles.navButtonDisabled,
          isForwardLocked && styles.navButtonLocked,
        ]}
        onPress={onForward}
        disabled={!canGoForward}
      >
        <Text
          style={[
            styles.navButtonText,
            nextButtonIsPrimary && styles.navButtonPrimaryText,
            !canGoForward && styles.navButtonTextDisabled,
          ]}
        >
          {isLastStep ? t('tourStep.finish', 'Finish') : t('tourStep.next')}
        </Text>
        {isForwardLocked ? (
          <MaterialCommunityIcons
            name="lock"
            size={18}
            color={Colors[theme].error}
            style={styles.lockedIcon}
          />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={22} color={nextContentColor} />
        )}
      </Pressable>
    </View>
  );
}

export default function TourNavigation({
  tour,
  currentStepIndex,
  solvedSteps,
  locationConfirmedSteps,
  onNavigateNext,
  onNavigatePrev,
  onStepSolved,
  onLocationConfirm,
  onEndTour,
  onSkipStep,
}: TourNavigationProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const [isDirectionsModalVisible, setIsDirectionsModalVisible] = useState(false);
  const [hasAnsweredCurrentStep, setHasAnsweredCurrentStep] = useState(false);
  const { skipCount, wrongAnswerCount } = useActiveTour();

  useEffect(() => {
    setHasAnsweredCurrentStep(false);
  }, [currentStepIndex]);
  //console.log('Rendering TourNavigation - currentStepIndex:', tour);
  const currentStep = tour.steps[currentStepIndex];
  const isSolved = solvedSteps.has(currentStep.id);
  const isLocationConfirmed = locationConfirmedSteps.has(currentStep.id);
  const requiresLocation = currentStep.requiresLocationConfirmation === true;

  const isLastStep = currentStepIndex === tour.steps.length - 1;

  const canGoBack = canNavigateBackward(currentStepIndex);
  const { t } = useTranslation();

  const hasAnsweredWrong = hasAnsweredCurrentStep && !isSolved;

  const isForwardLocked =
    (currentStep.type === 'puzzle' && !isSolved && !hasAnsweredWrong) ||
    (requiresLocation && !isLocationConfirmed);

  const canGoForward = isLastStep
    ? !isForwardLocked
    : hasAnsweredWrong
      ? currentStepIndex < tour.steps.length - 1 && !isForwardLocked
      : canNavigateForward(
          currentStep,
          currentStepIndex,
          tour.steps.length,
          solvedSteps,
          locationConfirmedSteps
        );
  const penaltyCount = skipCount + wrongAnswerCount;
  const skipBadgeColor =
    penaltyCount === 0 ? '#80ED99' : penaltyCount === 1 ? colors.star : colors.error;
  const badgeStatusLabel =
    penaltyCount === 0
      ? t('map.activeTour.badgeStatusGood')
      : penaltyCount === 1
        ? t('map.activeTour.badgeStatusRisk')
        : t('map.activeTour.badgeStatusReduced');

  const handleSolve = () => {
    onStepSolved(currentStep.id);
  };

  const handleLocationConfirm = async () => {
    if (!requiresLocation || isLocationConfirmed) return;

    try {
      const location = await Location.getCurrentPositionAsync({});
      await onLocationConfirm(currentStep.id, location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const handleOpenDirections = useCallback(
    async (provider: ExternalMapsProvider) => {
      setIsDirectionsModalVisible(false);

      let originLatitude: number | undefined;
      let originLongitude: number | undefined;

      try {
        const permission = await Location.getForegroundPermissionsAsync();
        const status =
          permission.status === 'granted'
            ? permission.status
            : (await Location.requestForegroundPermissionsAsync()).status;

        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({});
          originLatitude = location.coords.latitude;
          originLongitude = location.coords.longitude;
        }
      } catch (error) {
        console.warn('Could not get current location for directions:', error);
      }

      try {
        await openExternalMapsDirections({
          provider,
          destinationLat: currentStep.coordinate.latitude,
          destinationLng: currentStep.coordinate.longitude,
          originLat: originLatitude,
          originLng: originLongitude,
          mode: 'walking',
        });
      } catch (error) {
        console.error('Failed to open directions:', error);
        Alert.alert(t('tourId.error'), t('map.activeTour.directionsUnavailableMessage'));
      }
    },
    [currentStep.coordinate.latitude, currentStep.coordinate.longitude, t]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.actionGroup}>
          <View style={styles.badgeStatusCard}>
            <View style={[styles.badgeStatusDot, { backgroundColor: skipBadgeColor }]} />
            <Text style={styles.badgeStatusText}>{badgeStatusLabel}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={onSkipStep}
          >
            <MaterialCommunityIcons name="skip-forward" size={19} color={Colors[theme].primary} />
            <Text style={styles.actionLabel}>{t('map.activeTour.skip')}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
            onPress={() => setIsDirectionsModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('map.activeTour.directions')}
          >
            <MaterialCommunityIcons name="directions" size={19} color={Colors[theme].primary} />
            <Text style={styles.actionLabel}>{t('map.activeTour.route')}</Text>
          </Pressable>
        </View>
        {onEndTour && (
          <Pressable
            style={({ pressed }) => [
              styles.closeTourButton,
              pressed && styles.closeTourButtonPressed,
            ]}
            onPress={onEndTour}
          >
            <MaterialCommunityIcons name="close" size={20} color={Colors[theme].error} />
          </Pressable>
        )}
      </View>

      <View style={styles.stepContentContainer}>
        <TourStepComponent
          step={currentStep}
          isSolved={isSolved}
          onSolve={handleSolve}
          onAnswered={() => setHasAnsweredCurrentStep(true)}
        />
      </View>

      <NavigationArrows
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={onNavigatePrev}
        onForward={onNavigateNext}
        isForwardLocked={isForwardLocked}
        requiresLocation={requiresLocation}
        isLocationConfirmed={isLocationConfirmed}
        onLocationConfirm={handleLocationConfirm}
        isLastStep={isLastStep}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isDirectionsModalVisible}
        onRequestClose={() => setIsDirectionsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalDismissArea}
            onPress={() => setIsDirectionsModalVisible(false)}
          />

          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('map.activeTour.directions')}</Text>
            <Text style={styles.modalSubtitle}>{t('map.activeTour.openIn')}</Text>

            {Platform.OS === 'ios' && (
              <Pressable
                style={styles.providerButton}
                onPress={() => handleOpenDirections('apple')}
              >
                <MaterialCommunityIcons
                  name="apple"
                  size={20}
                  color={Colors[theme].text}
                  style={styles.providerIcon}
                />
                <Text style={styles.providerButtonText}>{t('map.activeTour.appleMaps')}</Text>
              </Pressable>
            )}

            <Pressable style={styles.providerButton} onPress={() => handleOpenDirections('google')}>
              <MaterialCommunityIcons
                name="google-maps"
                size={20}
                color={Colors[theme].text}
                style={styles.providerIcon}
              />
              <Text style={styles.providerButtonText}>{t('map.activeTour.googleMaps')}</Text>
            </Pressable>

            <Pressable style={styles.providerButton} onPress={() => handleOpenDirections('yandex')}>
              <MaterialCommunityIcons
                name="map-search-outline"
                size={20}
                color={Colors[theme].text}
                style={styles.providerIcon}
              />
              <Text style={styles.providerButtonText}>{t('map.activeTour.yandexMaps')}</Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setIsDirectionsModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>{t('auth.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
