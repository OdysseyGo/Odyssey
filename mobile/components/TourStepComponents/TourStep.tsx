import { View, Text, Image, Pressable, TextInput, ScrollView } from 'react-native';
import { useMemo, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import getStyles from './TourStep.styles';
import {
  TourStepProps,
  StoryStep,
  PuzzleStep,
  MultipleChoicePuzzle,
  TriviaPuzzle,
} from './TourStep.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

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

interface TriviaViewProps {
  puzzle: TriviaPuzzle;
  isSolved: boolean;
  onSolve: () => void;
}

function TriviaView({ puzzle, isSolved, onSolve }: TriviaViewProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [answer, setAnswer] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (isSolved || !answer.trim()) return;

    setHasSubmitted(true);

    const userAnswer = answer.trim();
    const correct = puzzle.correctAnswer.trim();

    const isMatch = puzzle.caseSensitive
      ? userAnswer === correct
      : userAnswer.toLowerCase() === correct.toLowerCase();

    if (isMatch) {
      setIsCorrect(true);
      onSolve();
    } else {
      setIsCorrect(false);
    }
  };

  const getInputStyle = () => {
    const baseStyle: object[] = [styles.triviaInput];

    if (hasSubmitted) {
      if (isCorrect || isSolved) {
        baseStyle.push(styles.triviaInputCorrect);
      } else {
        baseStyle.push(styles.triviaInputIncorrect);
      }
    }

    return baseStyle;
  };

  return (
    <View>
      <Text style={styles.puzzleQuestion}>{puzzle.question}</Text>

      {puzzle.imageUri && (
        <Image source={{ uri: puzzle.imageUri }} style={styles.puzzleImage} resizeMode="cover" />
      )}

      <View style={styles.triviaInputContainer}>
        <TextInput
          style={getInputStyle()}
          value={answer}
          onChangeText={setAnswer}
          placeholder="Enter your answer..."
          placeholderTextColor={Colors[theme].placeholder}
          editable={!isSolved}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
        />

        <Pressable
          style={[
            styles.triviaSubmitButton,
            (!answer.trim() || isSolved) && styles.triviaSubmitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!answer.trim() || isSolved}
        >
          <Text style={styles.triviaSubmitText}>Submit</Text>
        </Pressable>
      </View>
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

      {step.puzzle.type === 'multiple-choice' && (
        <MultipleChoiceView
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
