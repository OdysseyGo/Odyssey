import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';

import getStyles from './TourNavigation.styles';
import {
  TourNavigationProps,
  ProgressBarProps,
  NavigationArrowsProps,
  canNavigateForward,
  canNavigateBackward,
} from './TourNavigation.config';
import TourStepComponent from './TourStep';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

function ProgressBar({ totalSteps, currentStep, solvedSteps, stepIds }: ProgressBarProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t } = useTranslation();

  const progressPercent = totalSteps > 1 ? (currentStep / (totalSteps - 1)) * 100 : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>{t('tourStep.tourProgress')}</Text>
        <Text style={styles.progressText}>
          {currentStep + 1} / {totalSteps}
        </Text>
      </View>

      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
      </View>

      <View style={styles.progressDotsContainer}>
        {stepIds.map((stepId, index) => {
          const dotStyle: object[] = [styles.progressDot];

          if (index === currentStep) {
            dotStyle.push(styles.progressDotCurrent);
          } else if (solvedSteps.has(stepId) || index < currentStep) {
            dotStyle.push(styles.progressDotCompleted);
          } else {
            dotStyle.push(styles.progressDotLocked);
          }

          return <View key={stepId} style={dotStyle} />;
        })}
      </View>
    </View>
  );
}

function NavigationArrows({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  isForwardLocked,
  requiresLocation,
  isLocationConfirmed,
  onLocationConfirm,
}: NavigationArrowsProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t } = useTranslation();

  return (
    <View style={styles.navigationContainer}>
      <Pressable
        style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
        onPress={onBack}
        disabled={!canGoBack}
      >
        <MaterialCommunityIcons
          name="chevron-left"
          size={24}
          color={canGoBack ? Colors[theme].iconActive : Colors[theme].iconDisabled}
        />
        <Text style={[styles.navButtonText, !canGoBack && styles.navButtonTextDisabled]}>{t('tourStep.back')}</Text>
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
          !canGoForward && styles.navButtonDisabled,
          isForwardLocked && styles.navButtonLocked,
        ]}
        onPress={onForward}
        disabled={!canGoForward}
      >
        <Text style={[styles.navButtonText, !canGoForward && styles.navButtonTextDisabled]}>
          {t('tourStep.next')}
        </Text>
        {isForwardLocked ? (
          <MaterialCommunityIcons
            name="lock"
            size={18}
            color={Colors[theme].error}
            style={styles.lockedIcon}
          />
        ) : (
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={canGoForward ? Colors[theme].iconActive : Colors[theme].iconDisabled}
          />
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
}: TourNavigationProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  console.log('Rendering TourNavigation - currentStepIndex:', tour);
  const currentStep = tour.steps[currentStepIndex];
  const isSolved = solvedSteps.has(currentStep.id);
  const isLocationConfirmed = locationConfirmedSteps.has(currentStep.id);
  const requiresLocation = currentStep.requiresLocationConfirmation === true;

  const canGoBack = canNavigateBackward(currentStepIndex);
  const canGoForward = canNavigateForward(
    currentStep,
    currentStepIndex,
    tour.steps.length,
    solvedSteps,
    locationConfirmedSteps
  );

  const isForwardLocked =
    (currentStep.type === 'puzzle' && !isSolved) || (requiresLocation && !isLocationConfirmed);

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ProgressBar
          totalSteps={tour.steps.length}
          currentStep={currentStepIndex}
          solvedSteps={solvedSteps}
          stepIds={tour.steps.map((s) => s.id)}
        />
        {onEndTour && (
          <Pressable style={styles.endTourButton} onPress={onEndTour}>
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={20}
              color={Colors[theme].error}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.stepContentContainer}>
        <TourStepComponent step={currentStep} isSolved={isSolved} onSolve={handleSolve} />
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
      />
    </View>
  );
}
