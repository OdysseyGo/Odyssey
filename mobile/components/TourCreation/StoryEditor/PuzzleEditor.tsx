import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, TextInput } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import StoryInputField from './StoryInputField';
import { Puzzle } from '../TourCreation.types';
import { Ionicons } from '@expo/vector-icons';

interface PuzzleEditorProps {
  puzzle?: Puzzle;
  onChange: (puzzle: Puzzle) => void;
}

export default function PuzzleEditor({ puzzle, onChange }: PuzzleEditorProps) {
  const theme = useColorTheme();
  const color = Colors[theme];

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
      <Text style={[styles.sectionTitle, { color: color.text }]}>Puzzle Challenge</Text>

      <StoryInputField
        label="Question / Challenge *"
        value={puzzle?.question || ''}
        onChangeText={(text) => handleChange('question', text)}
        placeholder="e.g., What year was the tower built?"
        hint="The question that users must answer."
        multiline
      />

      <View style={styles.optionsSection}>
        <Text style={[styles.label, { color: color.text }]}>
          Options (Mark the correct answer) *
        </Text>

        {options.map((option, index) => (
          <View key={index} style={styles.optionRow}>
            <TouchableOpacity
              onPress={() => handleSelectCorrect(option)}
              disabled={option.trim() === ''}
              style={styles.radioButton}
            >
              <Ionicons
                name={
                  correctAnswer === option && option.trim() !== ''
                    ? 'radio-button-on'
                    : 'radio-button-off'
                }
                size={24}
                color={
                  correctAnswer === option && option.trim() !== '' ? color.primary : color.icon
                }
              />
            </TouchableOpacity>

            <View
              style={[
                styles.optionInputContainer,
                { backgroundColor: color.foregroundSecondary, borderColor: color.border },
              ]}
            >
              <TextInput
                style={[styles.optionInput, { color: color.text }]}
                value={option}
                onChangeText={(text) => handleOptionChange(text, index)}
                placeholder={`Option ${index + 1}`}
                placeholderTextColor={color.placeholder}
              />
            </View>

            {options.length > 2 && (
              <TouchableOpacity
                onPress={() => handleRemoveOption(index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash-outline" size={20} color={color.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}

        <TouchableOpacity onPress={handleAddOption} style={styles.addButton}>
          <Ionicons name="add-circle-outline" size={20} color={color.primary} />
          <Text style={[styles.addButtonText, { color: color.primary }]}>Add Option</Text>
        </TouchableOpacity>
      </View>

      <StoryInputField
        label="Hint (Optional)"
        value={puzzle?.hint || ''}
        onChangeText={(text) => handleChange('hint', text)}
        placeholder="e.g., Look at the plaque above the door."
        hint="A helpful clue if the user gets stuck."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionsSection: {
    marginTop: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  radioButton: {
    padding: 4,
  },
  optionInputContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionInput: {
    fontSize: 16,
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
    alignSelf: 'flex-start',
    padding: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
