import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import getStyles from './TourStep.styles';
import {
  TourStepProps,
  StoryStep,
  PuzzleStep,
  MultipleChoicePuzzle,
  PictureComparePuzzle,
} from './TourStep.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { submitPictureCompare } from '@/api/tourProgress';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import SquareCameraOverlayCapture from '@/components/common/SquareCameraOverlayCapture';
import RewardedHintReveal from '@/components/Ads/RewardedHintReveal';

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

interface PuzzleStepViewProps {
  step: PuzzleStep;
  isSolved: boolean;
  onSolve: () => void;
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
      ) : (
        <PictureCompareView
          key={step.id}
          puzzle={step.puzzle}
          isSolved={isSolved}
          onSolve={onSolve}
        />
      )}

      {!isSolved && step.puzzle.hint ? <RewardedHintReveal hint={step.puzzle.hint} /> : null}
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
