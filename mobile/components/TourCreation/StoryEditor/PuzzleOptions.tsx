import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { puzzleOptionsStyles } from './PuzzleOptions.styles';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { requiredLabel } from './requiredLabel';

interface PuzzleOptionsProps {
  options: string[];
  correctAnswer: string;
  onOptionChange: (text: string, index: number) => void;
  onRemoveOption: (index: number) => void;
  onAddOption: () => void;
  onSelectCorrect: (option: string) => void;
  isRequired?: boolean;
}

export default function PuzzleOptions({
  options,
  correctAnswer,
  onOptionChange,
  onRemoveOption,
  onAddOption,
  onSelectCorrect,
  isRequired = false,
}: PuzzleOptionsProps) {
  const theme = useColorTheme();
  const styles = puzzleOptionsStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.optionsSection}>
      <Text style={styles.label}>
        {isRequired ? requiredLabel(t('creation.puzzle.options')) : t('creation.puzzle.options')}
      </Text>

      {options.map((option, index) => (
        <View key={index} style={styles.optionRow}>
          <TouchableOpacity
            onPress={() => onSelectCorrect(option)}
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
              color={correctAnswer === option && option.trim() !== '' ? color.primary : color.icon}
            />
          </TouchableOpacity>

          <View style={styles.optionInputContainer}>
            <TextInput
              style={styles.optionInput}
              value={option}
              onChangeText={(text) => onOptionChange(text, index)}
              placeholder={t('creation.puzzle.optionPlaceholder', { number: index + 1 })}
              placeholderTextColor={color.placeholder}
            />
          </View>

          {options.length > 2 && (
            <TouchableOpacity onPress={() => onRemoveOption(index)} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={20} color={color.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity onPress={onAddOption} style={styles.addButton}>
        <Ionicons name="add-circle-outline" size={20} color={color.primary} />
        <Text style={styles.addButtonText}>{t('creation.puzzle.addOption')}</Text>
      </TouchableOpacity>
    </View>
  );
}
