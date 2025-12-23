import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Puzzle, PuzzleType, PUZZLE_TYPE_OPTIONS, createEmptyPuzzle } from '../TourCreation.types';
import PuzzleQuestion from './PuzzleQuestion';
import PuzzleOptions from './PuzzleOptions';
import PuzzleHint from './PuzzleHint';
import { puzzleEditorStyles } from './PuzzleEditor.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

interface PuzzleEditorProps {
  puzzle?: Puzzle;
  onChange: (puzzle: Puzzle) => void;
  isRequired?: boolean;
}

export default function PuzzleEditor({ puzzle, onChange, isRequired = false }: PuzzleEditorProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = puzzleEditorStyles();

  const currentPuzzle = puzzle || createEmptyPuzzle();
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

  return (
    <View style={styles.container}>
      {/* Puzzle Type Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: color.text }]}>Puzzle Type *</Text>
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
              onPress={() => handleChange('puzzle_type', type.value as PuzzleType)}
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

      <PuzzleOptions
        options={options}
        correctAnswer={correctAnswer}
        onOptionChange={handleOptionChange}
        onRemoveOption={handleRemoveOption}
        onAddOption={handleAddOption}
        onSelectCorrect={handleSelectCorrect}
        isRequired={isRequired}
      />

      <PuzzleHint hint={currentPuzzle.hint} onChange={(text) => handleChange('hint', text)} />

      {/* XP Reward Input */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: color.text }]}>XP Reward</Text>
        <TextInput
          style={[styles.xpInput, { color: color.text, borderColor: color.borderLight }]}
          value={String(currentPuzzle.xp_reward)}
          onChangeText={(text) => {
            const num = parseInt(text, 10);
            if (!isNaN(num) && num >= 0) {
              handleChange('xp_reward', num);
            } else if (text === '') {
              handleChange('xp_reward', 0);
            }
          }}
          keyboardType="number-pad"
          placeholder="10"
          placeholderTextColor={color.placeholder}
        />
      </View>
    </View>
  );
}
