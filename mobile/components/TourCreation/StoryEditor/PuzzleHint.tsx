import React from 'react';
import { useTranslation } from 'react-i18next';
import StoryInputField from './StoryInputField';

interface PuzzleHintProps {
  hint: string;
  onChange: (text: string) => void;
}

export default function PuzzleHint({ hint, onChange }: PuzzleHintProps) {
  const { t } = useTranslation();
  return (
    <StoryInputField
      label={t('creation.puzzle.hintLabel')}
      value={hint}
      onChangeText={onChange}
      placeholder={t('creation.puzzle.hintPlaceholder')}
      hint={t('creation.puzzle.hintText')}
    />
  );
}
