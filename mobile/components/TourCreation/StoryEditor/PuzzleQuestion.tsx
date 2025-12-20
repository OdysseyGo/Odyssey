import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import StoryInputField from './StoryInputField';
import { puzzleQuestionStyles } from './PuzzleQuestion.styles';

interface PuzzleQuestionProps {
  question: string;
  onChange: (text: string) => void;
  isRequired?: boolean;
}

export default function PuzzleQuestion({
  question,
  onChange,
  isRequired = false,
}: PuzzleQuestionProps) {
  const theme = useColorTheme();
  const styles = puzzleQuestionStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Puzzle Challenge</Text>
      <StoryInputField
        label={`Question / Challenge${isRequired ? ' *' : ''}`}
        value={question}
        onChangeText={onChange}
        placeholder="e.g., What year was the tower built?"
        hint="The question that users must answer."
        multiline
      />
    </View>
  );
}
