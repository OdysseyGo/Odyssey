import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import StoryInputField from './StoryInputField';
import { puzzleQuestionStyles } from './PuzzleQuestion.styles';
import { useTranslation } from 'react-i18next';
import { TOUR_TEXT_FIELD_MAX_LENGTH } from '../TourCreation.types';

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
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        {t('creation.puzzle.challenge')}
        {isRequired ? ' *' : ''}
      </Text>
      <StoryInputField
        label={`${t('creation.puzzle.question')}${isRequired ? ' *' : ''}`}
        value={question}
        onChangeText={onChange}
        placeholder={t('creation.puzzle.questionPlaceholder')}
        hint={t('creation.puzzle.questionHint')}
        multiline
        maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
      />
    </View>
  );
}
