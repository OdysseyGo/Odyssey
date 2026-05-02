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
  Animated as RNAnimated,
} from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import getStyles from './TourStep.styles';
import {
  TourStepProps,
  StoryStep,
  PuzzleStep,
  MultipleChoicePuzzle,
  OpenEndedPuzzle,
  PictureComparePuzzle,
  ArCodePuzzle,
  CompassBearingPuzzle,
} from './TourStep.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import {
  DEFAULT_MAX_FAILED_ATTEMPTS,
  submitArCode,
  submitOpenEndedAnswer,
  submitPictureCompare,
  submitTriviaAnswer,
} from '@/api/tourProgress';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import SquareCameraOverlayCapture from '@/components/common/SquareCameraOverlayCapture';
import RewardedHintReveal from '@/components/Ads/RewardedHintReveal';
import {
  circularDeltaDegrees,
  headingFromSensors,
  normalizeHeading,
  shortestAngleDelta,
  smoothHeading,
} from '@/utils/compass';

const COMPASS_FEEDBACK_INTERVAL_DEGREES = 10;
const COMPASS_FEEDBACK_BAND_SHIFT = 1;
const COMPASS_SOLVE_TOLERANCE_DEGREES = 20;
const COMPASS_SOLVE_HOLD_MS = 1200;
const COMPASS_SOLVE_GRACE_MS = 120;
const COMPASS_SENSOR_UPDATE_MS = 50;
const COMPASS_PROXIMITY_RANGE_DEGREES = 50;
const COMPASS_HEADING_SMOOTHING_ALPHA_SLOW = 0.16;
const COMPASS_HEADING_SMOOTHING_ALPHA_MEDIUM = 0.3;
const COMPASS_HEADING_SMOOTHING_ALPHA_FAST = 0.45;
const COMPASS_HEADING_SMOOTHING_MEDIUM_DELTA_DEGREES = 5;
const COMPASS_HEADING_SMOOTHING_FAST_DELTA_DEGREES = 12;
const COMPASS_HEADING_DEADBAND_DEGREES = 0.35;
const COMPASS_HAPTIC_COOLDOWN_MS_BY_BAND = [120, 170, 240, 340, 480, 700];
const COMPASS_HEADING_OFFSET_DEGREES = 0;
const COMPASS_STATE_UPDATE_EPSILON = 0.01;
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
  lightBackground: '#F8FAFC',
  lightBackground2: '#E0F2FE',
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
  if (solved) return 'Waypoint found';
  if (alignmentProgress > 0.72) return 'Signal locked';
  if (alignmentProgress > 0.18) return 'Hold steady';
  if (resonanceLevel > 0.72) return 'Strong signal';
  if (resonanceLevel > 0.38) return 'Signal found';
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
  if (solved) return 'The tour waypoint is locked in.';
  if (alignmentProgress > 0.18) return 'Keep the phone still until the beacon fills.';
  if (resonanceLevel > 0.12) return 'Move gently and follow the stronger signal.';
  return 'Rotate the phone slowly to search for the waypoint.';
}

function getSignalStrengthText(resonanceLevel: number, solved: boolean) {
  if (solved) return 'Locked';
  if (resonanceLevel > 0.72) return 'Strong';
  if (resonanceLevel > 0.38) return 'Good';
  if (resonanceLevel > 0.12) return 'Weak';
  return 'Searching';
}

function getBeaconActionText({
  solved,
  aligned,
  hasHeading,
}: {
  solved: boolean;
  aligned: boolean;
  hasHeading: boolean;
}) {
  if (solved) return 'Waypoint locked';
  if (aligned) return 'Hold steady';
  if (!hasHeading) return 'Move gently';
  return 'Scan slowly';
}

interface StoryStepViewProps {
  step: StoryStep;
}

function StoryStepView({ step }: StoryStepViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.storyContainer}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepTypeRow}>
        <View style={styles.storyHeroHeader}>
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={22}
            color={Colors[theme].primary}
          />
          <Text style={styles.storyHeroHeaderText}>Story</Text>
        </View>
      </View>

      <View style={styles.storyHeader}>
        <Text style={styles.storyTitle}>{step.title}</Text>
      </View>

      <View style={styles.contentCard}>
        <Text style={styles.storyDescription}>{step.description}</Text>
      </View>

      {step.images && step.images.length > 0 && (
        <View style={styles.storyImagesContainer}>
          <Text style={styles.sectionLabel}>Scenes from this stop</Text>
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
  isFinished?: boolean;
  onSolve: () => void;
  onAnswered?: () => void;
  stepId?: string;
}

function MultipleChoiceView({
  puzzle,
  isSolved,
  isFinished = false,
  onSolve,
  onAnswered,
  stepId,
}: MultipleChoiceViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t } = useTranslation();
  const { progressId, recordWrongAnswer, recordAnswer, stepAnswers, stepAttempts } =
    useActiveTour();

  const persistedAnswer = stepId ? (stepAnswers.get(stepId) ?? null) : null;
  const persistedWrongAttemptCount = stepId ? (stepAttempts.get(stepId) ?? 0) : 0;
  const hasPersistedWrongAttempt = persistedWrongAttemptCount > 0 && !persistedAnswer && !isSolved;
  const shouldRevealAnswer = isSolved || isFinished || hasPersistedWrongAttempt;
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(persistedAnswer);
  const [hasSubmitted, setHasSubmitted] = useState(
    persistedAnswer !== null || hasPersistedWrongAttempt || isFinished
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const bounceAnim = useRef(new RNAnimated.Value(1)).current;

  const runShake = () => {
    RNAnimated.sequence([
      RNAnimated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      RNAnimated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const runBounce = () => {
    RNAnimated.sequence([
      RNAnimated.spring(bounceAnim, { toValue: 1.05, useNativeDriver: true, speed: 30 }),
      RNAnimated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const handleSelectOption = (optionId: string) => {
    if (isSolved || hasSubmitted || hasPersistedWrongAttempt || isSubmitting) return;

    Alert.alert(t('tourStep.answerConfirmTitle'), t('tourStep.answerConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tourStep.answerConfirmAction'),
        onPress: async () => {
          const selectedOption = puzzle.options.find((opt) => opt.id === optionId);
          if (!selectedOption) return;

          if (!progressId) {
            Alert.alert(
              'Progress missing',
              'Could not verify puzzle without active tour progress.'
            );
            return;
          }

          setSelectedOptionId(optionId);
          setIsSubmitting(true);
          try {
            const response = await submitTriviaAnswer(progressId, selectedOption.text);
            setHasSubmitted(true);
            onAnswered?.();
            if (stepId) recordAnswer(stepId, optionId);

            if (response.accepted) {
              onSolve();
              runBounce();
            } else {
              recordWrongAnswer();
              runShake();
            }
          } catch (error) {
            setSelectedOptionId(null);
            console.error('submit trivia answer failed', error);
            Alert.alert(t('common.error'), t('common.syncError'));
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  const getOptionIndicator = (optionId: string) => {
    if (isSubmitting && selectedOptionId === optionId) {
      return <ActivityIndicator size="small" color={Colors[theme].background} />;
    }

    if (selectedOptionId === optionId) {
      return <MaterialCommunityIcons name="check" size={14} color={Colors[theme].background} />;
    }

    return null;
  };

  const getOptionStyle = (optionId: string) => {
    const baseStyle: object[] = [styles.optionButton];

    if (hasSubmitted || shouldRevealAnswer) {
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
    <View style={styles.puzzleBody}>
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Question</Text>
        <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      </View>

      {puzzle.imageUri && (
        <Image source={{ uri: puzzle.imageUri }} style={styles.puzzleImage} resizeMode="cover" />
      )}

      <View style={styles.optionsContainer}>
        {puzzle.options.map((option) => {
          const isWrongSelected =
            hasSubmitted && selectedOptionId === option.id && !option.isCorrect;
          const isCorrectRevealed = (hasSubmitted || shouldRevealAnswer) && option.isCorrect;
          const animStyle = isWrongSelected
            ? { transform: [{ translateX: shakeAnim }] }
            : isCorrectRevealed
              ? { transform: [{ scale: bounceAnim }] }
              : undefined;

          return (
            <RNAnimated.View key={option.id} style={animStyle}>
              <Pressable
                style={getOptionStyle(option.id)}
                onPress={() => handleSelectOption(option.id)}
                disabled={isSolved || hasSubmitted || hasPersistedWrongAttempt || isSubmitting}
              >
                <View
                  style={[
                    styles.optionIndicator,
                    selectedOptionId === option.id && styles.optionIndicatorSelected,
                  ]}
                >
                  {getOptionIndicator(option.id)}
                </View>
                <Text style={styles.optionText}>{option.text}</Text>
              </Pressable>
            </RNAnimated.View>
          );
        })}
      </View>

      {(hasPersistedWrongAttempt || isFinished) && !isSolved && (
        <Text style={styles.exhaustedHint}>
          {isFinished
            ? 'This question is finished. The correct answer is revealed.'
            : 'You have already answered this question.'}
        </Text>
      )}
    </View>
  );
}

const MAX_ATTEMPTS = DEFAULT_MAX_FAILED_ATTEMPTS;

interface PictureCompareViewProps {
  puzzle: PictureComparePuzzle;
  isSolved: boolean;
  onSolve: () => void;
  onAnswered?: () => void;
  stepId?: string;
}

function PictureCompareView({
  puzzle,
  isSolved,
  onSolve,
  onAnswered,
  stepId,
}: PictureCompareViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { progressId, recordWrongAnswer, recordAttempt, stepAttempts } = useActiveTour();

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [maxAttempts, setMaxAttempts] = useState(MAX_ATTEMPTS);
  const attemptCount = stepId ? (stepAttempts.get(stepId) ?? 0) : 0;
  const isExhausted = attemptCount >= maxAttempts;
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
      if (typeof response.max_attempts === 'number') {
        setMaxAttempts(response.max_attempts);
      }
      const similarityPercent = Math.round((response.similarity_score || 0) * 100);

      if (response.accepted) {
        setFeedback(`Matched (${similarityPercent}%).`);
        onSolve();
      } else {
        if (stepId) recordAttempt(stepId);
        const newCount = response.attempt_count ?? attemptCount + 1;
        if (newCount >= maxAttempts) {
          setFeedback(`Not close enough (${similarityPercent}%). No attempts remaining.`);
          recordWrongAnswer();
          onAnswered?.();
        } else {
          setFeedback(
            `Not close enough (${similarityPercent}%). ${maxAttempts - newCount} attempt${maxAttempts - newCount === 1 ? '' : 's'} remaining.`
          );
        }
      }
    } catch (error: any) {
      const serverAttemptCount = Number(error?.response?.data?.attempt_count ?? NaN);
      const serverMaxAttempts = Number(error?.response?.data?.max_attempts ?? NaN);
      if (!Number.isNaN(serverMaxAttempts)) {
        setMaxAttempts(serverMaxAttempts);
      }
      if (!Number.isNaN(serverAttemptCount) && stepId) {
        const missingAttempts = Math.max(0, serverAttemptCount - attemptCount);
        for (let i = 0; i < missingAttempts; i += 1) {
          recordAttempt(stepId);
        }
      }
      console.error('submit picture compare failed', error);
      setFeedback('Could not verify image right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.puzzleBody}>
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Photo challenge</Text>
        <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      </View>

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

      {!isSolved && (
        <View style={styles.attemptsRow}>
          <Text style={styles.attemptsLabel}>Attempts</Text>
          {Array.from({ length: maxAttempts }, (_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < attemptCount ? 'circle' : 'circle-outline'}
              size={10}
              color={i < attemptCount ? Colors[theme].error : Colors[theme].subText}
            />
          ))}
        </View>
      )}

      <Pressable
        style={[
          styles.captureButton,
          (isSolved || isSubmitting || isExhausted) && styles.captureButtonDisabled,
        ]}
        onPress={handleCaptureAndCheck}
        disabled={isSolved || isSubmitting || isExhausted}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Colors[theme].white} />
        ) : (
          <Text style={styles.captureButtonText}>{isSolved ? 'Solved' : 'Capture and Check'}</Text>
        )}
      </Pressable>

      {feedback ? (
        <Text style={[styles.feedbackText, isExhausted && styles.exhaustedText]}>{feedback}</Text>
      ) : null}
      {isExhausted && !isSolved && (
        <Text style={styles.exhaustedHint}>Confirm your location and press Next to continue.</Text>
      )}

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

interface OpenEndedViewProps {
  puzzle: OpenEndedPuzzle;
  isSolved: boolean;
  onSolve: () => void;
  onAnswered?: () => void;
  stepId?: string;
}

function OpenEndedView({ puzzle, isSolved, onSolve, onAnswered, stepId }: OpenEndedViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { progressId, recordWrongAnswer, recordAttempt, stepAttempts } = useActiveTour();

  const [answerInput, setAnswerInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [maxAttempts, setMaxAttempts] = useState(MAX_ATTEMPTS);
  const attemptCount = stepId ? (stepAttempts.get(stepId) ?? 0) : 0;
  const isExhausted = attemptCount >= maxAttempts;

  const handleSubmit = async () => {
    if (isSolved || isSubmitting || isExhausted) return;

    if (!progressId) {
      Alert.alert('Progress missing', 'Could not verify puzzle without active tour progress.');
      return;
    }

    const trimmedAnswer = answerInput.trim();
    if (!trimmedAnswer) {
      setFeedback('Enter an answer first.');
      setFeedbackTone('error');
      return;
    }

    setIsSubmitting(true);
    setFeedback('Checking answer...');
    setFeedbackTone('neutral');
    try {
      const response = await submitOpenEndedAnswer(progressId, trimmedAnswer);
      const responseMaxAttempts =
        typeof response.max_attempts === 'number' ? response.max_attempts : maxAttempts;
      setMaxAttempts(responseMaxAttempts);
      if (response.accepted) {
        setFeedback('That matches. This step is unlocked.');
        setFeedbackTone('success');
        onSolve();
      } else {
        if (stepId) recordAttempt(stepId);
        const newCount = response.attempt_count ?? attemptCount + 1;
        if (newCount >= responseMaxAttempts) {
          if (response.revealed_answer) {
            setAnswerInput(response.revealed_answer);
          }
          setFeedback('Answer is not close enough. No attempts remaining.');
          setFeedbackTone('error');
          recordWrongAnswer();
          onAnswered?.();
        } else {
          setFeedback(
            `Answer is not close enough. ${responseMaxAttempts - newCount} attempt${responseMaxAttempts - newCount === 1 ? '' : 's'} remaining.`
          );
          setFeedbackTone('error');
        }
      }
    } catch (error: any) {
      const serverAttemptCount = Number(error?.response?.data?.attempt_count ?? NaN);
      const serverMaxAttempts = Number(error?.response?.data?.max_attempts ?? NaN);
      if (!Number.isNaN(serverMaxAttempts)) {
        setMaxAttempts(serverMaxAttempts);
      }
      if (!Number.isNaN(serverAttemptCount) && stepId) {
        const missingAttempts = Math.max(0, serverAttemptCount - attemptCount);
        for (let i = 0; i < missingAttempts; i += 1) {
          recordAttempt(stepId);
        }
      }
      const revealedAnswer = error?.response?.data?.revealed_answer;
      if (typeof revealedAnswer === 'string' && revealedAnswer.trim()) {
        setAnswerInput(revealedAnswer);
      }
      console.error('submit open ended answer failed', error);
      setFeedback(
        error?.response?.data?.error || 'Could not verify answer right now. Please try again.'
      );
      setFeedbackTone('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.puzzleBody}>
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>Open ended</Text>
        <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      </View>

      {!isSolved && (
        <View style={styles.attemptsRow}>
          <Text style={styles.attemptsLabel}>Attempts</Text>
          {Array.from({ length: maxAttempts }, (_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < attemptCount ? 'circle' : 'circle-outline'}
              size={10}
              color={i < attemptCount ? Colors[theme].error : Colors[theme].subText}
            />
          ))}
        </View>
      )}

      <TextInput
        style={styles.secretCodeInput}
        value={answerInput}
        onChangeText={setAnswerInput}
        editable={!isSolved && !isSubmitting && !isExhausted}
        placeholder="Type your answer"
        autoCapitalize="none"
      />

      <Pressable
        style={[
          styles.captureButton,
          (isSolved || isSubmitting || isExhausted) && styles.captureButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isSolved || isSubmitting || isExhausted}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={Colors[theme].white} />
        ) : (
          <Text style={styles.captureButtonText}>Submit answer</Text>
        )}
      </Pressable>

      {feedback ? (
        <View
          style={[
            styles.feedbackCard,
            feedbackTone === 'success' && styles.feedbackCardSuccess,
            feedbackTone === 'error' && styles.feedbackCardError,
          ]}
        >
          {feedbackTone === 'success' ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={Colors[theme].easy}
              style={styles.feedbackIcon}
            />
          ) : null}
          <Text
            style={[
              styles.feedbackText,
              feedbackTone === 'success' && styles.feedbackTextSuccess,
              feedbackTone === 'error' && styles.feedbackTextError,
            ]}
          >
            {feedback}
          </Text>
        </View>
      ) : null}

      {isExhausted && !isSolved && (
        <Text style={styles.exhaustedHint}>No attempts remaining. You can skip this step.</Text>
      )}
    </View>
  );
}

interface ArCodeViewProps {
  puzzle: ArCodePuzzle;
  isSolved: boolean;
  onSolve: () => void;
  onAnswered?: () => void;
  stepId?: string;
}

function ArCodeView({ puzzle, isSolved, onSolve, onAnswered, stepId }: ArCodeViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { progressId, recordWrongAnswer, recordAttempt, stepAttempts } = useActiveTour();

  const [codeInput, setCodeInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingAr, setIsPreparingAr] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [maxAttempts, setMaxAttempts] = useState(MAX_ATTEMPTS);
  const attemptCount = stepId ? (stepAttempts.get(stepId) ?? 0) : 0;
  const isExhausted = attemptCount >= maxAttempts;

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
      setFeedbackTone('error');
      return;
    }

    setIsSubmitting(true);
    setFeedback('Checking code...');
    setFeedbackTone('neutral');
    try {
      const response = await submitArCode(progressId, trimmedCode);
      if (typeof response.max_attempts === 'number') {
        setMaxAttempts(response.max_attempts);
      }
      if (response.accepted) {
        setFeedback('Code accepted. This AR challenge is complete.');
        setFeedbackTone('success');
        onSolve();
      } else {
        if (stepId) recordAttempt(stepId);
        const newCount = response.attempt_count ?? attemptCount + 1;
        if (newCount >= maxAttempts) {
          setFeedback('Code is not correct. No attempts remaining.');
          setFeedbackTone('error');
          recordWrongAnswer();
          onAnswered?.();
        } else {
          setFeedback(
            `Code is not correct. ${maxAttempts - newCount} attempt${maxAttempts - newCount === 1 ? '' : 's'} remaining.`
          );
          setFeedbackTone('error');
        }
      }
    } catch (error: any) {
      const serverAttemptCount = Number(error?.response?.data?.attempt_count ?? NaN);
      const serverMaxAttempts = Number(error?.response?.data?.max_attempts ?? NaN);
      if (!Number.isNaN(serverMaxAttempts)) {
        setMaxAttempts(serverMaxAttempts);
      }
      if (!Number.isNaN(serverAttemptCount) && stepId) {
        const missingAttempts = Math.max(0, serverAttemptCount - attemptCount);
        for (let i = 0; i < missingAttempts; i += 1) {
          recordAttempt(stepId);
        }
      }
      console.error('submit ar code failed', error);
      setFeedback('Could not verify code right now. Please try again.');
      setFeedbackTone('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.puzzleBody}>
      <View style={styles.questionCard}>
        <View style={styles.storyHeroHeader}>
          <MaterialCommunityIcons name="cube-scan" size={22} color={Colors[theme].primary} />
          <Text style={styles.storyHeroHeaderText}>AR Challenge</Text>
        </View>
        <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      </View>

      <View style={styles.optionsContainer}>
        <Pressable
          style={[
            styles.optionButton,
            (!puzzle.sceneAssetUrl || isPreparingAr) && styles.captureButtonDisabled,
          ]}
          onPress={handleOpenPuzzleView}
          disabled={!puzzle.sceneAssetUrl || isPreparingAr}
        >
          <View style={styles.arActionIndicator}>
            {isPreparingAr ? (
              <ActivityIndicator size="small" color={Colors[theme].primary} />
            ) : (
              <MaterialCommunityIcons name="cube-scan" size={20} color={Colors[theme].primary} />
            )}
          </View>
          <Text style={styles.optionText}>Open AR View</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={Colors[theme].subText} />
        </Pressable>
      </View>

      <Text style={styles.sectionLabel}>Enter the secret code</Text>

      {!isSolved && (
        <View style={styles.attemptsRow}>
          <Text style={styles.attemptsLabel}>Attempts</Text>
          {Array.from({ length: maxAttempts }, (_, i) => (
            <MaterialCommunityIcons
              key={i}
              name={i < attemptCount ? 'circle' : 'circle-outline'}
              size={10}
              color={i < attemptCount ? Colors[theme].error : Colors[theme].subText}
            />
          ))}
        </View>
      )}

      <TextInput
        value={codeInput}
        onChangeText={setCodeInput}
        style={styles.secretCodeInput}
        placeholder="Enter secret code"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSolved && !isSubmitting && !isExhausted}
      />

      <Pressable
        style={[
          styles.captureButton,
          (isSolved || isSubmitting || isExhausted) && styles.captureButtonDisabled,
        ]}
        onPress={handleCheckCode}
        disabled={isSolved || isSubmitting || isExhausted}
      >
        {isSubmitting ? (
          <ActivityIndicator color={Colors[theme].white} />
        ) : (
          <Text style={styles.captureButtonText}>{isSolved ? 'Solved' : 'Check Code'}</Text>
        )}
      </Pressable>

      {feedback ? (
        <View
          style={[
            styles.feedbackCard,
            feedbackTone === 'success' && styles.feedbackCardSuccess,
            feedbackTone === 'error' && styles.feedbackCardError,
          ]}
        >
          {feedbackTone === 'success' ? (
            <MaterialCommunityIcons
              name="check-circle"
              size={16}
              color={Colors[theme].easy}
              style={styles.feedbackIcon}
            />
          ) : null}
          <Text
            style={[
              styles.feedbackText,
              feedbackTone === 'success' && styles.feedbackTextSuccess,
              feedbackTone === 'error' && styles.feedbackTextError,
            ]}
          >
            {feedback}
          </Text>
        </View>
      ) : null}
      {isExhausted && !isSolved && (
        <Text style={styles.exhaustedHint}>Confirm your location and press Next to continue.</Text>
      )}
    </View>
  );
}

interface PuzzleStepViewProps {
  step: PuzzleStep;
  isSolved: boolean;
  isFinished?: boolean;
  onSolve: () => void;
  onAnswered?: () => void;
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
  }, [isSolved, solvedShared]);

  useEffect(() => {
    holdProgressShared.value = withTiming(holdProgress, { duration: 200 });
  }, [holdProgress, holdProgressShared]);

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
      setHeading((previousHeading) =>
        previousHeading !== null &&
        Math.abs(shortestAngleDelta(previousHeading, nextHeading)) <
          COMPASS_HEADING_DEADBAND_DEGREES
          ? previousHeading
          : nextHeading
      );
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
    const proximityLinear = Math.max(0, 1 - delta / COMPASS_PROXIMITY_RANGE_DEGREES);
    const proximity = Math.pow(proximityLinear, 1.6);
    proximityProgress.value = proximity;
    setResonanceLevel((previousResonanceLevel) =>
      Math.abs(previousResonanceLevel - proximity) < COMPASS_STATE_UPDATE_EPSILON
        ? previousResonanceLevel
        : proximity
    );

    const now = Date.now();
    if (delta <= COMPASS_SOLVE_TOLERANCE_DEGREES) {
      if (holdStartedAtMsRef.current === null) {
        holdStartedAtMsRef.current = now;
      }
      lastInWindowAtMsRef.current = now;

      const heldFor = now - holdStartedAtMsRef.current;
      const progress = Math.min(1, heldFor / COMPASS_SOLVE_HOLD_MS);
      setHoldProgress((previousHoldProgress) =>
        Math.abs(previousHoldProgress - progress) < COMPASS_STATE_UPDATE_EPSILON
          ? previousHoldProgress
          : progress
      );

      if (heldFor >= COMPASS_SOLVE_HOLD_MS) {
        solvedRef.current = true;
        setHoldProgress((previousHoldProgress) =>
          previousHoldProgress === 1 ? previousHoldProgress : 1
        );
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
        setHoldProgress((previousHoldProgress) =>
          previousHoldProgress === 0 ? previousHoldProgress : 0
        );
      }
    }

    if (solvedRef.current) {
      solvedRef.current = true;
      return;
    }

    const band = Math.max(
      0,
      Math.floor(delta / COMPASS_FEEDBACK_INTERVAL_DEGREES) - COMPASS_FEEDBACK_BAND_SHIFT
    );
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
  }, [heading, onSolve, proximityProgress, solvedShared, targetHeading]);

  const solved = isSolved || solvedRef.current;
  const resonance = clamp01(resonanceLevel);
  const progress = solved ? 1 : clamp01(holdProgress);
  const absoluteDelta = heading === null ? null : circularDeltaDegrees(heading, targetHeading);
  const isAligned =
    solved || (absoluteDelta !== null && absoluteDelta <= COMPASS_SOLVE_TOLERANCE_DEGREES);
  const signalStrengthText = getSignalStrengthText(resonance, solved);
  const beaconActionText = getBeaconActionText({
    solved,
    aligned: isAligned,
    hasHeading: heading !== null,
  });
  const guidanceText = isAligned ? 'Hold to lock' : 'Rotate slowly';
  const holdPercent = Math.round(progress * 100);
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
  const beaconCoreRadius = 22 + progress * 17;
  const markerFillOpacity = 0.1 + resonance * 0.16 + progress * 0.26;
  const activeStrokeOpacity = 0.34 + resonance * 0.26 + progress * 0.18;
  const beaconColor = Colors[theme].primary;
  const beaconHighlightColor = Colors[theme].white;
  const beaconBackgroundColor =
    theme === 'dark' ? GEM_COLORS.background : GEM_COLORS.lightBackground;
  const beaconBackgroundAccentColor =
    theme === 'dark' ? GEM_COLORS.background2 : GEM_COLORS.lightBackground2;

  return (
    <View>
      <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
      <View style={styles.gemPuzzleFrame}>
        <View style={styles.gemHeader}>
          <Text style={styles.gemTitle}>Find the Waypoint</Text>
          <Text style={styles.gemSubtitle}>Rotate your phone until the tour beacon locks on.</Text>
        </View>

        <View style={styles.gemGuideCard}>
          <View style={styles.gemCueRow}>
            <View style={[styles.gemCueIcon, isAligned && styles.gemCueIconAligned]}>
              <MaterialCommunityIcons
                name={isAligned ? 'check' : 'radar'}
                size={24}
                color={isAligned ? GEM_COLORS.background : beaconColor}
              />
            </View>
            <View style={styles.gemCueCopy}>
              <Text style={styles.gemCueLabel}>Beacon status</Text>
              <Text style={styles.gemCueText}>{beaconActionText}</Text>
            </View>
            <Text style={styles.gemAccuracyText}>{signalStrengthText}</Text>
          </View>

          <View style={styles.gemReadoutRow}>
            <View style={styles.gemReadoutItem}>
              <Text style={styles.gemReadoutLabel}>Signal</Text>
              <Text style={styles.gemReadoutValue}>{signalStrengthText}</Text>
            </View>
            <View style={styles.gemReadoutDivider} />
            <View style={styles.gemReadoutItem}>
              <Text style={styles.gemReadoutLabel}>Goal</Text>
              <Text style={styles.gemReadoutValue}>{guidanceText}</Text>
            </View>
          </View>
        </View>

        <Reanimated.View style={[styles.gemStage, gemStageAnimatedStyle]}>
          <Svg width={280} height={280} viewBox="0 0 260 260">
            <Defs>
              <LinearGradient id="gemFillGradient" x1="0" y1="232" x2="0" y2="28">
                <Stop offset="0" stopColor={beaconColor} stopOpacity="0.72" />
                <Stop offset="0.55" stopColor={beaconColor} stopOpacity="0.95" />
                <Stop offset="1" stopColor={beaconHighlightColor} stopOpacity="0.9" />
              </LinearGradient>
              <LinearGradient id="solvedFillGradient" x1="0" y1="232" x2="0" y2="28">
                <Stop offset="0" stopColor={GEM_COLORS.solvedGreen} stopOpacity="0.95" />
                <Stop offset="0.55" stopColor={beaconColor} stopOpacity="0.95" />
                <Stop offset="1" stopColor={beaconHighlightColor} stopOpacity="0.95" />
              </LinearGradient>
              <LinearGradient id="vignetteGradient" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={beaconBackgroundAccentColor} stopOpacity="0.9" />
                <Stop offset="1" stopColor={beaconBackgroundColor} stopOpacity="1" />
              </LinearGradient>
            </Defs>

            <Rect x={0} y={0} width={260} height={260} fill="url(#vignetteGradient)" />

            <Circle
              cx={130}
              cy={130}
              r={glowRadius}
              fill={solved ? GEM_COLORS.solvedGreen : beaconColor}
              opacity={glowOpacity}
            />
            <Circle
              cx={130}
              cy={130}
              r={glowRadius * 0.7}
              fill={beaconColor}
              opacity={glowOpacity * 0.45}
            />

            <Circle
              cx={130}
              cy={130}
              r={82}
              fill="none"
              stroke={beaconColor}
              strokeWidth={2.4}
              opacity={ringOpacity}
            />
            <Circle
              cx={130}
              cy={130}
              r={106}
              fill="none"
              stroke={beaconColor}
              strokeWidth={2}
              strokeDasharray="34 22"
              opacity={ringOpacity * 0.7}
            />
            <Circle
              cx={130}
              cy={130}
              r={128}
              fill="none"
              stroke={beaconColor}
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
                fill={solved && index % 3 === 0 ? GEM_COLORS.solvedGreen : beaconColor}
                opacity={particleOpacity}
              />
            ))}

            <Path
              d="M130 42 C94 42 66 70 66 106 C66 154 130 222 130 222 C130 222 194 154 194 106 C194 70 166 42 130 42 Z"
              fill={solved ? 'url(#solvedFillGradient)' : 'url(#gemFillGradient)'}
              opacity={markerFillOpacity}
              stroke={`rgba(255,255,255,${activeStrokeOpacity.toFixed(3)})`}
              strokeWidth={3}
            />
            <Circle
              cx={130}
              cy={106}
              r={46}
              fill={beaconBackgroundColor}
              stroke={solved ? GEM_COLORS.solvedGreen : beaconColor}
              strokeWidth={3}
              opacity={0.95}
            />
            <Circle
              cx={130}
              cy={106}
              r={beaconCoreRadius}
              fill={solved ? GEM_COLORS.solvedGreen : beaconColor}
              opacity={0.82}
            />
            <Path
              d="M130 82 L142 106 L130 130 L118 106 Z"
              fill={beaconHighlightColor}
              opacity={0.68 + progress * 0.25}
            />
            <Circle
              cx={130}
              cy={106}
              r={70 + progress * 8}
              fill="none"
              stroke={solved ? GEM_COLORS.solvedGreen : beaconColor}
              strokeWidth={3}
              opacity={ringOpacity}
            />
            {solved && (
              <Circle
                cx={130}
                cy={106}
                r={86}
                fill="none"
                stroke={GEM_COLORS.solvedGreen}
                strokeWidth={5}
                opacity={0.5}
              />
            )}
          </Svg>
        </Reanimated.View>

        <Text style={styles.gemStatus}>{statusText}</Text>
        <Text style={styles.gemInstruction}>{instructionText}</Text>
        <View style={styles.gemHoldCard}>
          <View style={styles.gemHoldHeader}>
            <Text style={styles.gemHoldLabel}>Hold progress</Text>
            <Text style={styles.gemHoldValue}>{holdPercent}%</Text>
          </View>
          <View style={styles.gemHoldTrack}>
            <View style={[styles.gemHoldFill, { width: `${holdPercent}%` }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

function PuzzleStepView({ step, isSolved, isFinished, onSolve, onAnswered }: PuzzleStepViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <ScrollView
      style={styles.puzzleContainer}
      contentContainerStyle={styles.stepScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepTypeRow}>
        <View style={styles.puzzleHeader}>
          <MaterialCommunityIcons name="puzzle" size={22} color={Colors[theme].primary} />
          <Text style={styles.puzzleHeaderText}>Puzzle</Text>
        </View>
        {isSolved && (
          <View style={styles.solvedPill}>
            <MaterialCommunityIcons
              name="check-circle"
              size={14}
              color={Colors[theme].background}
            />
            <Text style={styles.solvedText}>Solved</Text>
          </View>
        )}
      </View>

      {step.description && (
        <View style={styles.puzzleStoryBlock}>
          <View style={styles.storyMiniHeader}>
            <MaterialCommunityIcons
              name="book-open-page-variant"
              size={13}
              color={Colors[theme].primary}
            />
            <Text style={styles.storyMiniHeaderText}>Story</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.puzzleDescription}>{step.description}</Text>
          </View>
        </View>
      )}

      {step.puzzle.type === 'multiple-choice' ? (
        <MultipleChoiceView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          isFinished={isFinished}
          onSolve={onSolve}
          onAnswered={onAnswered}
          stepId={step.id}
        />
      ) : step.puzzle.type === 'open-ended' ? (
        <OpenEndedView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          onSolve={onSolve}
          onAnswered={onAnswered}
          stepId={step.id}
        />
      ) : step.puzzle.type === 'ar-code' ? (
        <ArCodeView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          onSolve={onSolve}
          onAnswered={onAnswered}
          stepId={step.id}
        />
      ) : step.puzzle.type === 'compass-bearing' ? (
        <CompassView key={step.id} puzzle={step.puzzle} isSolved={isSolved} onSolve={onSolve} />
      ) : (
        <PictureCompareView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          onSolve={onSolve}
          onAnswered={onAnswered}
          stepId={step.id}
        />
      )}

      {!isSolved && step.puzzle.hint ? (
        <RewardedHintReveal hint={step.puzzle.hint} stepId={step.id} />
      ) : null}
    </ScrollView>
  );
}

export default function TourStepComponent({
  step,
  isSolved,
  isFinished,
  onSolve,
  onAnswered,
}: TourStepProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {step.type === 'story' && <StoryStepView step={step} />}

      {step.type === 'puzzle' && (
        <PuzzleStepView
          step={step}
          isSolved={isSolved}
          isFinished={isFinished}
          onSolve={onSolve}
          onAnswered={onAnswered}
        />
      )}
    </View>
  );
}
