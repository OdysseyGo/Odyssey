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
} from 'react-native';
import { useMemo, useState } from 'react';
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
import { submitArCode, submitPictureCompare } from '@/api/tourProgress';
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
}

function MultipleChoiceView({ puzzle, isSolved, onSolve, onAnswered }: MultipleChoiceViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { t } = useTranslation();
  const { recordWrongAnswer } = useActiveTour();

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSelectOption = (optionId: string) => {
    if (isSolved || hasSubmitted) return;

    Alert.alert(t('tourStep.answerConfirmTitle'), t('tourStep.answerConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('tourStep.answerConfirmAction'),
        onPress: () => {
          setSelectedOptionId(optionId);
          setHasSubmitted(true);
          onAnswered?.();

          const selectedOption = puzzle.options.find((opt) => opt.id === optionId);
          if (selectedOption?.isCorrect) {
            onSolve();
          } else {
            recordWrongAnswer();
          }
        },
      },
    ]);
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
        {puzzle.options.map((option) => (
          <Pressable
            key={option.id}
            style={getOptionStyle(option.id)}
            onPress={() => handleSelectOption(option.id)}
            disabled={isSolved || hasSubmitted}
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
    <View style={styles.puzzleBody}>
      <View style={styles.questionCard}>
        <Text style={styles.questionLabel}>AR challenge</Text>
        <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>
        <Text style={styles.questionHint}>
          Open the model, find the hidden secret code, then enter it below.
        </Text>
      </View>

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
        />
      ) : step.puzzle.type === 'ar-code' ? (
        <ArCodeView key={step.id} puzzle={step.puzzle} isSolved={isSolved} onSolve={onSolve} />
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
