import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Puzzle, PuzzleType, PUZZLE_TYPE_OPTIONS, createEmptyPuzzle } from '../TourCreation.types';
import PuzzleQuestion from './PuzzleQuestion';
import PuzzleOptions from './PuzzleOptions';
import PuzzleHint from './PuzzleHint';
import ImageUploadSection from './ImageUploadSection';
import ARPuzzleConfigurator from './ARPuzzleConfigurator';
import { puzzleEditorStyles } from './PuzzleEditor.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

interface PuzzleEditorProps {
  puzzle?: Puzzle;
  onChange: (puzzle: Puzzle) => void;
  isRequired?: boolean;
}

export default function PuzzleEditor({ puzzle, onChange, isRequired = false }: PuzzleEditorProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = puzzleEditorStyles();
  const { t } = useTranslation();

  const currentPuzzle = puzzle || createEmptyPuzzle();
  const isPictureCompare = currentPuzzle.puzzle_type === 'PICTURE_COMPARE';
  const isArChallenge = currentPuzzle.puzzle_type === 'AR';
  const isGyroscope = currentPuzzle.puzzle_type === 'GYROSCOPE';
  const options = currentPuzzle.options;
  const correctAnswer = currentPuzzle.correctAnswer;

  const handleChange = (field: keyof Puzzle, value: any) => {
    onChange({
      ...currentPuzzle,
      [field]: value,
    });
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;

    // If we're renaming the correct answer, update the correct answer value too
    const oldOptionValue = options[index];
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === oldOptionValue) {
      newCorrectAnswer = text;
    }

    onChange({
      ...currentPuzzle,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    });
  };

  const handleAddOption = () => {
    handleChange('options', [...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    const optionToRemove = options[index];
    const newOptions = options.filter((_, i) => i !== index);

    // If we removed the correct answer, reset it
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionToRemove) {
      newCorrectAnswer = '';
    }

    onChange({
      ...currentPuzzle,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    });
  };

  const handleSelectCorrect = (option: string) => {
    handleChange('correctAnswer', option);
  };

  const handleTypeChange = (nextType: PuzzleType) => {
    if (nextType === 'PICTURE_COMPARE') {
      onChange({
        ...currentPuzzle,
        puzzle_type: nextType,
        options: [],
        // Backend serializer injects this for picture compare as fallback as well.
        correctAnswer: 'PICTURE_COMPARE',
      });
      return;
    }

    if (nextType === 'AR' || nextType === 'GYROSCOPE') {
      onChange({
        ...currentPuzzle,
        puzzle_type: nextType,
        options: [],
        correctAnswer: '',
      });
      return;
    }

    onChange({
      ...currentPuzzle,
      puzzle_type: nextType,
      options: currentPuzzle.options.length > 0 ? currentPuzzle.options : ['', ''],
      correctAnswer:
        currentPuzzle.correctAnswer === 'PICTURE_COMPARE' ? '' : currentPuzzle.correctAnswer,
    });
  };

  return (
    <View style={styles.container}>
      {/* Puzzle Type Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: color.text }]}>{t('creation.puzzle.type')} *</Text>
        <View style={styles.typeContainer}>
          {PUZZLE_TYPE_OPTIONS.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                { borderColor: color.borderLight },
                currentPuzzle.puzzle_type === type.value && {
                  backgroundColor: color.primary,
                  borderColor: color.primary,
                },
              ]}
              onPress={() => handleTypeChange(type.value as PuzzleType)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: currentPuzzle.puzzle_type === type.value ? color.white : color.text },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <PuzzleQuestion
        question={currentPuzzle.question}
        onChange={(text) => handleChange('question', text)}
        isRequired={isRequired}
      />

      {isPictureCompare ? (
        <ImageUploadSection
          image={currentPuzzle.referenceImage}
          onImageChange={(value) => handleChange('referenceImage', value)}
          label="Pick your target image"
          required
          useReferenceImageUI
          infoMessage={[
            'Pick something that is not temporary.',
            'Appropriate.',
            "Has good lighting and doesn't depend much on the time of day.",
          ].join('\n')}
        />
      ) : isArChallenge ? (
        <ARPuzzleConfigurator
          value={currentPuzzle.arConfig}
          onChange={(config) => handleChange('arConfig', config)}
        />
      ) : isGyroscope ? null : (
        <PuzzleOptions
          options={options}
          correctAnswer={correctAnswer}
          onOptionChange={handleOptionChange}
          onRemoveOption={handleRemoveOption}
          onAddOption={handleAddOption}
          onSelectCorrect={handleSelectCorrect}
          isRequired={isRequired}
        />
      )}

      <PuzzleHint hint={currentPuzzle.hint} onChange={(text) => handleChange('hint', text)} />
    </View>
  );
}
