import React from 'react';
import StoryInputField from './StoryInputField';

interface PuzzleHintProps {
  hint: string;
  onChange: (text: string) => void;
}

export default function PuzzleHint({ hint, onChange }: PuzzleHintProps) {
  return (
    <StoryInputField
      label="Hint (Optional)"
      value={hint}
      onChangeText={onChange}
      placeholder="e.g., Look at the plaque above the door."
      hint="A helpful clue if the user gets stuck."
    />
  );
}
