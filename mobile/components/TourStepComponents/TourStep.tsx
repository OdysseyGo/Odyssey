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
  Animated,
} from 'react-native';
import { useMemo, useState, useRef } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { useTranslation } from 'react-i18next';

import getStyles from './TourStep.styles';
import {
  TourStepProps,
  StoryStep,
  PuzzleStep,
  MultipleChoicePuzzle,
  PictureComparePuzzle,
  ArCodePuzzle,
} from './TourStep.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { submitArCode, submitPictureCompare, submitTriviaAnswer } from '@/api/tourProgress';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import SquareCameraOverlayCapture from '@/components/common/SquareCameraOverlayCapture';

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
  onSolve: () => void;
  onAnswered?: () => void;
  stepId?: string;
}

function MultipleChoiceView({
  puzzle,
  isSolved,
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
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(persistedAnswer);
  const [hasSubmitted, setHasSubmitted] = useState(
    persistedAnswer !== null || hasPersistedWrongAttempt
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const runShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const runBounce = () => {
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 1.05, useNativeDriver: true, speed: 30 }),
      Animated.spring(bounceAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
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
          const isCorrectRevealed = (hasSubmitted || isSolved) && option.isCorrect;
          const animStyle = isWrongSelected
            ? { transform: [{ translateX: shakeAnim }] }
            : isCorrectRevealed
              ? { transform: [{ scale: bounceAnim }] }
              : undefined;

          return (
            <Animated.View key={option.id} style={animStyle}>
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
            </Animated.View>
          );
        })}
      </View>

      {hasPersistedWrongAttempt && !isSolved && (
        <Text style={styles.exhaustedHint}>You have already answered this question.</Text>
      )}
    </View>
  );
}

const MAX_ATTEMPTS = 3;

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
  const attemptCount = stepId ? (stepAttempts.get(stepId) ?? 0) : 0;
  const isExhausted = attemptCount >= MAX_ATTEMPTS;
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
        if (stepId) recordAttempt(stepId);
        const newCount = attemptCount + 1;
        if (newCount >= MAX_ATTEMPTS) {
          setFeedback(`Not close enough (${similarityPercent}%). No attempts remaining.`);
          recordWrongAnswer();
          onAnswered?.();
        } else {
          setFeedback(
            `Not close enough (${similarityPercent}%). ${MAX_ATTEMPTS - newCount} attempt${MAX_ATTEMPTS - newCount === 1 ? '' : 's'} remaining.`
          );
        }
      }
    } catch (error) {
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
          {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
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
  const attemptCount = stepId ? (stepAttempts.get(stepId) ?? 0) : 0;
  const isExhausted = attemptCount >= MAX_ATTEMPTS;

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
        if (stepId) recordAttempt(stepId);
        const newCount = attemptCount + 1;
        if (newCount >= MAX_ATTEMPTS) {
          setFeedback('Code is not correct. No attempts remaining.');
          recordWrongAnswer();
          onAnswered?.();
        } else {
          setFeedback(
            `Code is not correct. ${MAX_ATTEMPTS - newCount} attempt${MAX_ATTEMPTS - newCount === 1 ? '' : 's'} remaining.`
          );
        }
      }
    } catch (error) {
      console.error('submit ar code failed', error);
      setFeedback('Could not verify code right now. Please try again.');
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
          {Array.from({ length: MAX_ATTEMPTS }, (_, i) => (
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
        <Text style={[styles.feedbackText, isExhausted && styles.exhaustedText]}>{feedback}</Text>
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
  onSolve: () => void;
  onAnswered?: () => void;
}

function PuzzleStepView({ step, isSolved, onSolve, onAnswered }: PuzzleStepViewProps) {
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
    </ScrollView>
  );
}

export default function TourStepComponent({ step, isSolved, onSolve, onAnswered }: TourStepProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  return (
    <View style={styles.container}>
      {step.type === 'story' && <StoryStepView step={step} />}

      {step.type === 'puzzle' && (
        <PuzzleStepView step={step} isSolved={isSolved} onSolve={onSolve} onAnswered={onAnswered} />
      )}
    </View>
  );
}
