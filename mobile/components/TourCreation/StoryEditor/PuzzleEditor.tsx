import React from 'react';
import { View } from 'react-native';
import { Puzzle } from '../TourCreation.types';
import PuzzleQuestion from './PuzzleQuestion';
import PuzzleOptions from './PuzzleOptions';
import PuzzleHint from './PuzzleHint';
import { puzzleEditorStyles } from './PuzzleEditor.styles';

interface PuzzleEditorProps {
  puzzle?: Puzzle;
  onChange: (puzzle: Puzzle) => void;
  isRequired?: boolean;
}

export default function PuzzleEditor({ puzzle, onChange, isRequired = false }: PuzzleEditorProps) {
  const styles = puzzleEditorStyles();

  const options = puzzle?.options || ['', ''];
  const correctAnswer = puzzle?.correctAnswer || '';

  const handleChange = (field: keyof Puzzle, value: any) => {
    onChange({
      question: puzzle?.question || '',
      options: puzzle?.options || ['', ''],
      correctAnswer: puzzle?.correctAnswer || '',
      hint: puzzle?.hint || '',
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
      question: puzzle?.question || '',
      options: newOptions,
      correctAnswer: newCorrectAnswer,
      hint: puzzle?.hint || '',
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
      question: puzzle?.question || '',
      options: newOptions,
      correctAnswer: newCorrectAnswer,
      hint: puzzle?.hint || '',
    });
  };

  const handleSelectCorrect = (option: string) => {
    handleChange('correctAnswer', option);
  };

  return (
    <View style={styles.container}>
      <PuzzleQuestion
        question={puzzle?.question || ''}
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

      <PuzzleHint hint={puzzle?.hint || ''} onChange={(text) => handleChange('hint', text)} />
    </View>
  );
}
