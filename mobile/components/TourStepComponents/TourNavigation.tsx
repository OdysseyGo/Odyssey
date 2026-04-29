import { View, Text, Pressable, Modal, Alert, Platform, Animated } from 'react-native';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
import HexBadge from '@/components/ProfileComponents/HexBadge';
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

const TIER_BADGE_CODE: Record<string, string | null> = {
  gold: 'CITY_GOLD',
  silver: 'CITY_SILVER',
  bronze: 'CITY_BRONZE',
  loss: null,
};

const HEX_W = 100;
const HEX_H = 104;

const NO_TEXT_CONFIG = {
  text: { y: 2 },
  text_plate: { y: 2 },
};

const LOSS_VISUAL_CONFIG = {
  text: { y: 2 },
  text_plate: { y: 2 },
  palette: {
    neutral: {
      outer_fill: '#f1f5f9',
      inner_fill: '#f8fafc',
      border: '#e2e8f0',
      border_color: '#e2e8f0',
      inner_border_color: '#e2e8f0',
      text: '#94a3b8',
    },
  },
};

function TierMiniHex({ tier, scale }: { tier: string; scale: number }) {
  const scaledW = HEX_W * scale;
  const scaledH = HEX_H * scale;
  // Centre the layout box of the unscaled badge inside the clip container,
  // so the transform-from-centre lands the scaled visual exactly within bounds.
  const left = scaledW / 2 - HEX_W / 2;
  const top = scaledH / 2 - HEX_H / 2;

  return (
    <View style={{ width: scaledW, height: scaledH, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', left, top, transform: [{ scale }] }}>
        <HexBadge
          code={TIER_BADGE_CODE[tier] ?? null}
          fallbackLabel=""
          visualConfig={tier === 'loss' ? LOSS_VISUAL_CONFIG : NO_TEXT_CONFIG}
        />
      </View>
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
  const { skipCount, wrongAnswerCount, stepAnswers, stepAttempts } = useActiveTour();

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

  const hasPersistedTriviaWrongAttempt =
    currentStep.type === 'puzzle' &&
    currentStep.puzzle.type === 'multiple-choice' &&
    (stepAttempts.get(currentStep.id) ?? 0) > 0;
  const hasAnsweredWrong =
    (hasAnsweredCurrentStep || stepAnswers.has(currentStep.id) || hasPersistedTriviaWrongAttempt) &&
    !isSolved;

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
  const TIER_COLORS = {
    gold: '#F59E0B',
    silver: '#94A3B8',
    bronze: '#CD7F32',
    loss: colors.error,
  } as const;

  type Tier = keyof typeof TIER_COLORS;

  const getTier = (count: number): Tier => {
    if (count === 0) return 'gold';
    if (count === 1) return 'silver';
    if (count === 2) return 'bronze';
    return 'loss';
  };

  const TIER_LABELS: Record<Tier, string> = {
    gold: t('map.activeTour.badgeStatusGold'),
    silver: t('map.activeTour.badgeStatusSilver'),
    bronze: t('map.activeTour.badgeStatusBronze'),
    loss: t('map.activeTour.badgeStatusLoss'),
  };

  const penaltyCount = skipCount + wrongAnswerCount;
  const currentTier = getTier(penaltyCount);
  const skipBadgeColor = TIER_COLORS[currentTier];
  const badgeStatusLabel = TIER_LABELS[currentTier];

  const prevTierRef = useRef<Tier>(currentTier);
  const [tierPopup, setTierPopup] = useState<{ from: Tier; to: Tier } | null>(null);
  const popupTranslateY = useRef(new Animated.Value(-80)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const crossOpacity = useRef(new Animated.Value(0)).current;
  const crossScale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (prevTierRef.current === currentTier) return;
    const from = prevTierRef.current;
    prevTierRef.current = currentTier;
    setTierPopup({ from, to: currentTier });
    popupTranslateY.setValue(-80);
    popupOpacity.setValue(0);
    crossOpacity.setValue(0);
    crossScale.setValue(0.3);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(popupTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.timing(popupOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(crossScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 14,
          bounciness: 10,
        }),
        Animated.timing(crossOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(popupTranslateY, { toValue: -80, duration: 260, useNativeDriver: true }),
        Animated.timing(popupOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]).start(() => setTierPopup(null));
  }, [currentTier]);

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
      {tierPopup && (
        <Animated.View
          style={[
            styles.tierPopup,
            { transform: [{ translateY: popupTranslateY }], opacity: popupOpacity },
          ]}
        >
          <View style={styles.tierPopupBadgeCol}>
            <View>
              <TierMiniHex tier={tierPopup.from} scale={0.72} />
              <Animated.View
                style={[
                  styles.crossOverlay,
                  { opacity: crossOpacity, transform: [{ scale: crossScale }] },
                ]}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={34}
                  color="rgba(220, 38, 38, 0.88)"
                />
              </Animated.View>
            </View>
            <Text style={[styles.tierPopupLabel, { color: TIER_COLORS[tierPopup.from] }]}>
              {TIER_LABELS[tierPopup.from]}
            </Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.subText} />
          <View style={styles.tierPopupBadgeCol}>
            <TierMiniHex tier={tierPopup.to} scale={0.72} />
            <Text style={[styles.tierPopupLabel, { color: TIER_COLORS[tierPopup.to] }]}>
              {TIER_LABELS[tierPopup.to]}
            </Text>
          </View>
        </Animated.View>
      )}
      <View style={styles.headerRow}>
        <View style={styles.actionGroup}>
          <View style={[styles.badgeStatusCard, { borderColor: skipBadgeColor }]}>
            <TierMiniHex tier={currentTier} scale={0.4} />
            <View style={styles.badgeStatusTextGroup}>
              <Text style={styles.badgeStatusEyebrow}>{t('map.activeTour.badgeCurrentLabel')}</Text>
              <Text style={[styles.badgeStatusText, { color: skipBadgeColor }]}>
                {badgeStatusLabel}
              </Text>
            </View>
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
