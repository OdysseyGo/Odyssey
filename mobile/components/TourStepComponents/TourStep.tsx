import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  AppState,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';

import getStyles from './TourStep.styles';
import {
  TourStepProps,
  StoryStep,
  PuzzleStep,
  MultipleChoicePuzzle,
  PictureComparePuzzle,
  ArCodePuzzle,
  CompassBearingPuzzle,
} from './TourStep.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { submitArCode, submitPictureCompare } from '@/api/tourProgress';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import SquareCameraOverlayCapture from '@/components/common/SquareCameraOverlayCapture';
import {
  circularDeltaDegrees,
  headingFromSensors,
  normalizeHeading,
  shortestAngleDelta,
  smoothHeading,
} from '@/utils/compass';

const COMPASS_FEEDBACK_INTERVAL_DEGREES = 10;
const COMPASS_SOLVE_TOLERANCE_DEGREES = 10;
const COMPASS_SOLVE_HOLD_MS = 1200;
const COMPASS_SOLVE_GRACE_MS = 120;
const COMPASS_SENSOR_UPDATE_MS = 50;
const COMPASS_HEADING_SMOOTHING_ALPHA_SLOW = 0.16;
const COMPASS_HEADING_SMOOTHING_ALPHA_MEDIUM = 0.3;
const COMPASS_HEADING_SMOOTHING_ALPHA_FAST = 0.45;
const COMPASS_HEADING_SMOOTHING_MEDIUM_DELTA_DEGREES = 5;
const COMPASS_HEADING_SMOOTHING_FAST_DELTA_DEGREES = 12;
const COMPASS_HEADING_DEADBAND_DEGREES = 0.35;
const COMPASS_HAPTIC_COOLDOWN_MS_BY_BAND = [120, 170, 240, 340, 480, 700];
const COMPASS_HEADING_OFFSET_DEGREES = 0;
const GEM_TOP = 28;
const GEM_BOTTOM = 232;
const GEM_HEIGHT = GEM_BOTTOM - GEM_TOP;
const GEM_POLYGON_POINTS = '130,28 190,82 166,178 130,232 94,178 70,82';
const GEM_PARTICLES = [
  { x: 42, y: 98, r: 1.8 },
  { x: 58, y: 176, r: 1.3 },
  { x: 84, y: 48, r: 1.6 },
  { x: 102, y: 218, r: 2.0 },
  { x: 156, y: 44, r: 1.4 },
  { x: 190, y: 58, r: 2.2 },
  { x: 214, y: 132, r: 1.5 },
  { x: 198, y: 204, r: 1.8 },
  { x: 36, y: 138, r: 1.2 },
  { x: 228, y: 178, r: 2.4 },
  { x: 122, y: 18, r: 1.5 },
  { x: 138, y: 244, r: 1.7 },
] as const;

const GEM_COLORS = {
  background: '#050509',
  background2: '#0B0B14',
  gemBase: '#141421',
  gemFacet: '#1D1D2E',
  gemFacetDark: '#10101A',
  strokeIdle: 'rgba(255,255,255,0.28)',
  strokeActive: 'rgba(255,255,255,0.48)',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.68)',
  gold: '#FFD60A',
  amber: '#FF9F0A',
  paleGold: '#FFF3A0',
  solvedGreen: '#30D158',
} as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getGemStatusText({
  solved,
  alignmentProgress,
  resonanceLevel,
}: {
  solved: boolean;
  alignmentProgress: number;
  resonanceLevel: number;
}) {
  if (solved) return 'Gem awakened';
  if (alignmentProgress > 0.72) return 'Almost there';
  if (alignmentProgress > 0.18) return 'Hold steady';
  if (resonanceLevel > 0.72) return 'Strong resonance';
  if (resonanceLevel > 0.38) return 'Resonance found';
  if (resonanceLevel > 0.12) return 'Faint signal';
  return 'Turn slowly';
}

function getGemInstructionText({
  solved,
  alignmentProgress,
  resonanceLevel,
}: {
  solved: boolean;
  alignmentProgress: number;
  resonanceLevel: number;
}) {
  if (solved) return 'The gem is fully charged.';
  if (alignmentProgress > 0.18) return 'Hold this position to charge the gem.';
  if (resonanceLevel > 0.12) return 'Move gently and follow the resonance.';
  return 'Rotate the phone slowly until the gem responds.';
}

interface StoryStepViewProps {
  step: StoryStep;
}

function StoryStepView({ step }: StoryStepViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <ScrollView style={styles.storyContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.storyTitle}>{step.title}</Text>
      <Text style={styles.storyDescription}>{step.description}</Text>

      {step.images && step.images.length > 0 && (
        <View style={styles.storyImagesContainer}>
          {step.images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.storyImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

interface MultipleChoiceViewProps {
  puzzle: MultipleChoicePuzzle;
  isSolved: boolean;
  onSolve: () => void;
}

function MultipleChoiceView({ puzzle, isSolved, onSolve }: MultipleChoiceViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelectOption = (optionId: string) => {
    if (isSolved) return;

    setSelectedOptionId(optionId);
    setHasSubmitted(true);

    const selectedOption = puzzle.options.find((opt) => opt.id === optionId);
    if (selectedOption?.isCorrect) {
      setIsCorrect(true);
      onSolve();
    } else {
      setIsCorrect(false);
    }
  };

  const getOptionStyle = (optionId: string) => {
    const baseStyle: object[] = [styles.optionButton];

    if (hasSubmitted || isSolved) {
      const option = puzzle.options.find((opt) => opt.id === optionId);
      if (option?.isCorrect) {
        baseStyle.push(styles.optionButtonCorrect);
      } else if (optionId === selectedOptionId && !option?.isCorrect) {
        baseStyle.push(styles.optionButtonIncorrect);
      }
    } else if (optionId === selectedOptionId) {
      baseStyle.push(styles.optionButtonSelected);
    }

    return baseStyle;
  };

  return (
    <View>
      <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>

      {puzzle.imageUri && (
        <Image source={{ uri: puzzle.imageUri }} style={styles.puzzleImage} resizeMode="cover" />
      )}

      <View style={styles.optionsContainer}>
        {puzzle.options.map((option) => (
          <Pressable
            key={option.id}
            style={getOptionStyle(option.id)}
            onPress={() => handleSelectOption(option.id)}
            disabled={isSolved}
          >
            <View
              style={[
                styles.optionIndicator,
                selectedOptionId === option.id && styles.optionIndicatorSelected,
              ]}
            >
              {selectedOptionId === option.id && (
                <MaterialCommunityIcons name="check" size={14} color={Colors[theme].background} />
              )}
            </View>
            <Text style={styles.optionText}>{option.text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface PictureCompareViewProps {
  puzzle: PictureComparePuzzle;
  isSolved: boolean;
  onSolve: () => void;
}

function PictureCompareView({ puzzle, isSolved, onSolve }: PictureCompareViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { progressId } = useActiveTour();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const referenceImageUri = puzzle.referenceImageUri;

  const handleCaptureAndCheck = async () => {
    if (isSolved || isSubmitting) {
      return;
    }

    setIsCameraVisible(true);
  };

  const handleCapturedImage = async (photoUri: string) => {
    if (!progressId) {
      Alert.alert('Progress missing', 'Could not verify puzzle without active tour progress.');
      return;
    }

    setPreviewUri(photoUri);
    setIsSubmitting(true);
    setFeedback('Checking similarity...');

    try {
      const response = await submitPictureCompare(progressId, photoUri);
      const similarityPercent = Math.round((response.similarity_score || 0) * 100);

      if (response.accepted) {
        setFeedback(`Matched (${similarityPercent}%).`);
        onSolve();
      } else {
        setFeedback(`Not close enough (${similarityPercent}%). Try another angle.`);
      }
    } catch (error) {
      console.error('submit picture compare failed', error);
      setFeedback('Could not verify image right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>

      <Text style={styles.sectionLabel}>Look around and try to find this!</Text>
      {referenceImageUri ? (
        <Pressable
          style={styles.referenceImageButton}
          onPress={() => setFullscreenImageUri(referenceImageUri)}
          accessibilityRole="button"
          accessibilityLabel="Open reference image full screen"
        >
          <Image
            source={{ uri: referenceImageUri }}
            style={styles.referenceImagePreview}
            resizeMode="cover"
          />
          <View style={styles.referenceImageOverlay}>
            <Text style={styles.referenceImageOverlayText}>Tap to view full image</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.referenceImageMissing}>
          <Text style={styles.referenceImageMissingText}>Reference image is not available.</Text>
        </View>
      )}

      {previewUri && (
        <>
          <Text style={styles.sectionLabel}>Your latest attempt</Text>
          <Pressable
            style={styles.referenceImageButton}
            onPress={() => setFullscreenImageUri(previewUri)}
            accessibilityRole="button"
            accessibilityLabel="Open latest attempt full screen"
          >
            <Image
              source={{ uri: previewUri }}
              style={styles.referenceImagePreview}
              resizeMode="cover"
            />
            <View style={styles.referenceImageOverlay}>
              <Text style={styles.referenceImageOverlayText}>Tap to view full image</Text>
            </View>
          </Pressable>
        </>
      )}

      <Pressable
        style={[styles.captureButton, (isSolved || isSubmitting) && styles.captureButtonDisabled]}
        onPress={handleCaptureAndCheck}
        disabled={isSolved || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Colors[theme].white} />
        ) : (
          <Text style={styles.captureButtonText}>{isSolved ? 'Solved' : 'Capture and Check'}</Text>
        )}
      </Pressable>

      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}

      <SquareCameraOverlayCapture
        visible={isCameraVisible}
        onClose={() => setIsCameraVisible(false)}
        onCapture={handleCapturedImage}
        title="Align your view with the target"
        subtitle="Only the center square is analyzed for matching."
        captureLabel="Check Match"
      />

      <Modal
        visible={!!fullscreenImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <Pressable
          style={styles.referenceImageModalOverlay}
          onPress={() => setFullscreenImageUri(null)}
        >
          <View style={styles.referenceImageModalContent} pointerEvents="box-none">
            <Image
              source={{ uri: fullscreenImageUri ?? '' }}
              style={styles.referenceImageFull}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

interface ArCodeViewProps {
  puzzle: ArCodePuzzle;
  isSolved: boolean;
  onSolve: () => void;
}

function ArCodeView({ puzzle, isSolved, onSolve }: ArCodeViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { progressId } = useActiveTour();

  const [codeInput, setCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingAr, setIsPreparingAr] = useState(false);
  const [feedback, setFeedback] = useState('');

  const ensureArPermissions = async () => {
    const locationPerm = await Location.getForegroundPermissionsAsync();
    if (locationPerm.status !== 'granted') {
      const nextLocationPerm = await Location.requestForegroundPermissionsAsync();
      if (nextLocationPerm.status !== 'granted') {
        Alert.alert(
          'Location permission needed',
          'Location permission is required to continue with AR puzzle mode.'
        );
        return false;
      }
    }

    const cameraPerm = await Camera.getCameraPermissionsAsync();
    if (cameraPerm.status !== 'granted') {
      const nextCameraPerm = await Camera.requestCameraPermissionsAsync();
      if (nextCameraPerm.status !== 'granted') {
        Alert.alert(
          'Camera permission needed',
          'Camera permission is required to open the AR puzzle view.'
        );
        return false;
      }
    }

    return true;
  };

  const handleOpenPuzzleView = async () => {
    if (!puzzle.sceneAssetUrl || isPreparingAr) {
      return;
    }

    setIsPreparingAr(true);
    try {
      const hasPermissions = await ensureArPermissions();
      if (!hasPermissions) {
        return;
      }

      router.push({
        pathname: '/(tour)/ar-puzzle-view' as any,
        params: {
          sceneAssetUrl: puzzle.sceneAssetUrl,
          secretCode: puzzle.secretCode ?? '',
          anchorX: String(puzzle.anchorPosition?.x ?? 0),
          anchorY: String(puzzle.anchorPosition?.y ?? 0.3),
          anchorZ: String(puzzle.anchorPosition?.z ?? -1.2),
          modelScaleMeters: String(puzzle.modelScaleMeters ?? 1),
        },
      });
    } catch (error) {
      console.error('Failed to prepare AR permissions', error);
      Alert.alert('AR unavailable', 'Could not prepare the AR puzzle view right now.');
    } finally {
      setIsPreparingAr(false);
    }
  };

  const handleCheckCode = async () => {
    if (isSolved || isSubmitting) {
      return;
    }

    if (!progressId) {
      Alert.alert('Progress missing', 'Could not verify puzzle without active tour progress.');
      return;
    }

    const trimmedCode = codeInput.trim();
    if (!trimmedCode) {
      setFeedback('Enter the secret code first.');
      return;
    }

    setIsSubmitting(true);
    setFeedback('Checking code...');
    try {
      const response = await submitArCode(progressId, trimmedCode);
      if (response.accepted) {
        setFeedback('Code verified.');
        onSolve();
      } else {
        setFeedback('Code is not correct. Try again.');
      }
    } catch (error) {
      console.error('submit ar code failed', error);
      setFeedback('Could not verify code right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View>
      <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      <Text style={styles.sectionLabel}>
        This is an AR puzzle. Open the model, find the hidden secret code, then enter it below.
      </Text>

      <Pressable
        style={[
          styles.viewPuzzleButton,
          (!puzzle.sceneAssetUrl || isPreparingAr) && styles.captureButtonDisabled,
        ]}
        onPress={handleOpenPuzzleView}
        disabled={!puzzle.sceneAssetUrl || isPreparingAr}
      >
        {isPreparingAr ? (
          <ActivityIndicator color={Colors[theme].white} />
        ) : (
          <>
            <MaterialCommunityIcons name="eye-outline" size={18} color={Colors[theme].white} />
            <Text style={styles.viewPuzzleButtonText}>View Puzzle</Text>
          </>
        )}
      </Pressable>

      <TextInput
        value={codeInput}
        onChangeText={setCodeInput}
        style={styles.secretCodeInput}
        placeholder="Enter secret code"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSolved && !isSubmitting}
      />

      <Pressable
        style={[styles.captureButton, (isSolved || isSubmitting) && styles.captureButtonDisabled]}
        onPress={handleCheckCode}
        disabled={isSolved || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Colors[theme].white} />
        ) : (
          <Text style={styles.captureButtonText}>{isSolved ? 'Solved' : 'Check Code'}</Text>
        )}
      </Pressable>

      {feedback ? <Text style={styles.feedbackText}>{feedback}</Text> : null}
    </View>
  );
}

interface PuzzleStepViewProps {
  step: PuzzleStep;
  isSolved: boolean;
  onSolve: () => void;
}

interface CompassViewProps {
  puzzle: CompassBearingPuzzle;
  isSolved: boolean;
  onSolve: () => void;
}

function CompassView({ puzzle, isSolved, onSolve }: CompassViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const solvedRef = useRef(isSolved);
  const nextPulseAtMsRef = useRef(0);
  const holdStartedAtMsRef = useRef<number | null>(null);
  const lastInWindowAtMsRef = useRef<number | null>(null);
  const gravityRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const filteredHeadingRef = useRef<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const [resonanceLevel, setResonanceLevel] = useState(0);
  const proximityProgress = useSharedValue(0);
  const holdProgressShared = useSharedValue(0);
  const solvedShared = useSharedValue(isSolved ? 1 : 0);
  const targetHeading = normalizeHeading(puzzle.targetHeadingDegrees);

  const gemStageAnimatedStyle = useAnimatedStyle(() => {
    const solvedScale = solvedShared.value > 0.5 ? 1.06 : 1 + holdProgressShared.value * 0.04;
    return {
      transform: [{ scale: withTiming(solvedScale, { duration: 220 }) }],
    };
  });

  useEffect(() => {
    solvedRef.current = isSolved;
    solvedShared.value = withTiming(isSolved ? 1 : 0, { duration: 220 });
  }, [isSolved]);

  useEffect(() => {
    holdProgressShared.value = withTiming(holdProgress, { duration: 200 });
  }, [holdProgress]);

  useEffect(() => {
    Magnetometer.setUpdateInterval(COMPASS_SENSOR_UPDATE_MS);
    Accelerometer.setUpdateInterval(COMPASS_SENSOR_UPDATE_MS);

    const accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      gravityRef.current = { x, y, z };
    });

    const subscription = Magnetometer.addListener(({ x, y, z }) => {
      const rawHeading = headingFromSensors(
        { x, y, z },
        gravityRef.current,
        COMPASS_HEADING_OFFSET_DEGREES
      );
      const nextHeading =
        filteredHeadingRef.current === null
          ? rawHeading
          : (() => {
              const turnDelta = Math.abs(
                shortestAngleDelta(filteredHeadingRef.current as number, rawHeading)
              );
              const alpha =
                turnDelta > COMPASS_HEADING_SMOOTHING_FAST_DELTA_DEGREES
                  ? COMPASS_HEADING_SMOOTHING_ALPHA_FAST
                  : turnDelta > COMPASS_HEADING_SMOOTHING_MEDIUM_DELTA_DEGREES
                    ? COMPASS_HEADING_SMOOTHING_ALPHA_MEDIUM
                    : COMPASS_HEADING_SMOOTHING_ALPHA_SLOW;
              return smoothHeading(
                filteredHeadingRef.current as number,
                rawHeading,
                alpha,
                COMPASS_HEADING_DEADBAND_DEGREES
              );
            })();
      filteredHeadingRef.current = nextHeading;
      setHeading(nextHeading);
    });

    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        nextPulseAtMsRef.current = 0;
      }
    });

    return () => {
      subscription.remove();
      accelerometerSubscription.remove();
      appStateSub.remove();
    };
  }, []);

  useEffect(() => {
    if (heading === null || solvedRef.current) {
      return;
    }

    const delta = circularDeltaDegrees(heading, targetHeading);
    const proximityLinear = Math.max(0, 1 - delta / 45);
    const proximity = Math.pow(proximityLinear, 1.6);
    proximityProgress.value = proximity;
    setResonanceLevel(proximity);

    const now = Date.now();
    if (delta <= COMPASS_SOLVE_TOLERANCE_DEGREES) {
      if (holdStartedAtMsRef.current === null) {
        holdStartedAtMsRef.current = now;
      }
      lastInWindowAtMsRef.current = now;

      const heldFor = now - holdStartedAtMsRef.current;
      const progress = Math.min(1, heldFor / COMPASS_SOLVE_HOLD_MS);
      setHoldProgress(progress);

      if (heldFor >= COMPASS_SOLVE_HOLD_MS) {
        solvedRef.current = true;
        setHoldProgress(1);
        solvedShared.value = withTiming(1, { duration: 220 });
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSolve();
      }
    } else {
      const leftWindowAt = lastInWindowAtMsRef.current;
      const stillWithinGrace =
        leftWindowAt !== null && now - leftWindowAt <= COMPASS_SOLVE_GRACE_MS;
      if (!stillWithinGrace) {
        holdStartedAtMsRef.current = null;
        lastInWindowAtMsRef.current = null;
        setHoldProgress(0);
      }
    }

    if (solvedRef.current) {
      solvedRef.current = true;
      return;
    }

    const band = Math.floor(delta / COMPASS_FEEDBACK_INTERVAL_DEGREES);
    const clampedBand = Math.min(band, COMPASS_HAPTIC_COOLDOWN_MS_BY_BAND.length - 1);
    if (now >= nextPulseAtMsRef.current) {
      if (clampedBand <= 1) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (clampedBand <= 3) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        void Haptics.selectionAsync();
      }
      nextPulseAtMsRef.current = now + COMPASS_HAPTIC_COOLDOWN_MS_BY_BAND[clampedBand];
    }
  }, [heading, onSolve, proximityProgress, targetHeading]);

  const solved = isSolved || solvedRef.current;
  const resonance = clamp01(resonanceLevel);
  const progress = solved ? 1 : clamp01(holdProgress);
  const statusText = getGemStatusText({
    solved,
    alignmentProgress: progress,
    resonanceLevel: resonance,
  });
  const instructionText = getGemInstructionText({
    solved,
    alignmentProgress: progress,
    resonanceLevel: resonance,
  });

  const glowOpacity = solved ? 0.42 : 0.04 + resonance * 0.22 + progress * 0.16;
  const glowRadius = solved ? 128 : 74 + resonance * 46 + progress * 24;
  const ringOpacity = solved ? 0.5 : 0.04 + resonance * 0.28;
  const particleOpacity = solved ? 0.95 : resonance * 0.75;
  const fillHeight = GEM_HEIGHT * progress;
  const fillY = GEM_BOTTOM - fillHeight;
  const facetLineOpacity = 0.18 + resonance * 0.22;
  const activeStrokeOpacity = 0.28 + resonance * 0.2 + progress * 0.12;

  return (
    <View>
      <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      <View style={styles.gemPuzzleFrame}>
        <Text style={styles.gemTitle}>Awaken the Gem</Text>

        <Animated.View style={[styles.gemStage, gemStageAnimatedStyle]}>
          <Svg width={310} height={310} viewBox="0 0 260 260">
            <Defs>
              <LinearGradient id="gemFillGradient" x1="0" y1="232" x2="0" y2="28">
                <Stop offset="0" stopColor={GEM_COLORS.amber} stopOpacity="0.95" />
                <Stop offset="0.55" stopColor={GEM_COLORS.gold} stopOpacity="0.95" />
                <Stop offset="1" stopColor={GEM_COLORS.paleGold} stopOpacity="0.95" />
              </LinearGradient>
              <LinearGradient id="solvedFillGradient" x1="0" y1="232" x2="0" y2="28">
                <Stop offset="0" stopColor={GEM_COLORS.solvedGreen} stopOpacity="0.95" />
                <Stop offset="0.55" stopColor={GEM_COLORS.gold} stopOpacity="0.95" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.95" />
              </LinearGradient>
              <LinearGradient id="vignetteGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={GEM_COLORS.background2} stopOpacity="0.9" />
                <Stop offset="1" stopColor={GEM_COLORS.background} stopOpacity="1" />
              </LinearGradient>
              <ClipPath id="gemClip">
                <Polygon points={GEM_POLYGON_POINTS} />
              </ClipPath>
            </Defs>

            <Rect x={0} y={0} width={260} height={260} fill="url(#vignetteGradient)" />

            <Circle
              cx={130}
              cy={130}
              r={glowRadius}
              fill={solved ? GEM_COLORS.solvedGreen : GEM_COLORS.gold}
              opacity={glowOpacity}
            />
            <Circle
              cx={130}
              cy={130}
              r={glowRadius * 0.7}
              fill={solved ? GEM_COLORS.gold : GEM_COLORS.amber}
              opacity={glowOpacity * 0.45}
            />

            <Circle
              cx={130}
              cy={130}
              r={82}
              fill="none"
              stroke={GEM_COLORS.gold}
              strokeWidth={2.4}
              opacity={ringOpacity}
            />
            <Circle
              cx={130}
              cy={130}
              r={106}
              fill="none"
              stroke={GEM_COLORS.gold}
              strokeWidth={2}
              strokeDasharray="34 22"
              opacity={ringOpacity * 0.7}
            />
            <Circle
              cx={130}
              cy={130}
              r={128}
              fill="none"
              stroke={GEM_COLORS.gold}
              strokeWidth={1.6}
              strokeDasharray="48 30"
              opacity={ringOpacity * 0.45}
            />

            {GEM_PARTICLES.map((particle, index) => (
              <Circle
                key={`particle-${index}`}
                cx={particle.x}
                cy={particle.y}
                r={particle.r * (solved ? 1.35 : 0.75 + resonance * 0.65)}
                fill={solved && index % 3 === 0 ? GEM_COLORS.solvedGreen : GEM_COLORS.gold}
                opacity={particleOpacity}
              />
            ))}

            <Polygon
              points={GEM_POLYGON_POINTS}
              fill={GEM_COLORS.gemBase}
              stroke={`rgba(255,255,255,${activeStrokeOpacity.toFixed(3)})`}
              strokeWidth={2}
            />

            <Rect
              x={0}
              y={fillY}
              width={260}
              height={fillHeight}
              fill={solved ? 'url(#solvedFillGradient)' : 'url(#gemFillGradient)'}
              opacity={progress <= 0 ? 0 : 0.35 + progress * 0.65}
              clipPath="url(#gemClip)"
            />

            <Polygon points="130,28 190,82 130,126 70,82" fill="rgba(255,255,255,0.10)" />
            <Polygon points="70,82 130,126 94,178" fill="rgba(255,255,255,0.05)" />
            <Polygon points="190,82 166,178 130,126" fill="rgba(255,255,255,0.07)" />
            <Polygon points="130,126 166,178 130,232 94,178" fill="rgba(255,255,255,0.04)" />
            <Polygon
              points={GEM_POLYGON_POINTS}
              fill={solved ? 'rgba(255,214,10,0.12)' : 'rgba(255,214,10,0.08)'}
              opacity={resonance}
            />

            <Path
              d="M130 28 L130 126 M70 82 L130 126 M190 82 L130 126 M130 126 L94 178 M130 126 L166 178 M130 126 L130 232"
              stroke={`rgba(255,255,255,${facetLineOpacity.toFixed(3)})`}
              strokeWidth={1.2}
              fill="none"
            />

            <Path
              d="M102 72 L122 54 L114 86"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.22 + resonance * 0.45}
            />

            {solved && (
              <Circle
                cx={130}
                cy={130}
                r={146}
                fill="none"
                stroke={GEM_COLORS.solvedGreen}
                strokeWidth={5}
                opacity={0.5}
              />
            )}
          </Svg>
        </Animated.View>

        <Text style={styles.gemStatus}>{statusText}</Text>
        <Text style={styles.gemInstruction}>{instructionText}</Text>
      </View>
    </View>
  );
}

function PuzzleStepView({ step, isSolved, onSolve }: PuzzleStepViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <ScrollView style={styles.puzzleContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.puzzleTitleContainer}>
        <Text style={styles.puzzleTitle}>{step.title}</Text>
        {isSolved && (
          <MaterialCommunityIcons name="check-circle" size={20} color={Colors[theme].primary} />
        )}
      </View>

      {step.description && <Text style={styles.puzzleDescription}>{step.description}</Text>}

      {step.puzzle.type === 'multiple-choice' ? (
        <MultipleChoiceView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          onSolve={onSolve}
        />
      ) : step.puzzle.type === 'ar-code' ? (
        <ArCodeView key={step.id} puzzle={step.puzzle} isSolved={isSolved} onSolve={onSolve} />
      ) : step.puzzle.type === 'compass-bearing' ? (
        <CompassView key={step.id} puzzle={step.puzzle} isSolved={isSolved} onSolve={onSolve} />
      ) : (
        <PictureCompareView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          onSolve={onSolve}
        />
      )}
    </ScrollView>
  );
}

export default function TourStepComponent({ step, isSolved, onSolve }: TourStepProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {step.type === 'story' && <StoryStepView step={step} />}

      {step.type === 'puzzle' && (
        <PuzzleStepView step={step} isSolved={isSolved} onSolve={onSolve} />
      )}
    </View>
  );
}
