import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { formChipSelectStyles } from './FormChipSelect.styles';

type FormChipSelectProps<T extends string> = {
  options: readonly T[];
  selectedValue: T;
  onSelect: (value: T) => void;
};

export default function FormChipSelect<T extends string>({
  options,
  selectedValue,
  onSelect,
}: FormChipSelectProps<T>) {
  const theme = useColorTheme();
  const styles = formChipSelectStyles(theme);

  return (
    <View style={styles.chipContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option}
          style={[styles.chip, selectedValue === option && styles.chipSelected]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.chipText, selectedValue === option && styles.chipTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
