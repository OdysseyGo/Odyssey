import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { formOptionCardStyles } from './FormOptionCard.styles';

type OptionItem = {
  value: string;
  label: string;
  description: string;
};

type FormOptionCardProps = {
  options: readonly OptionItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
};

export default function FormOptionCard({ options, selectedValue, onSelect }: FormOptionCardProps) {
  const theme = useColorTheme();
  const styles = formOptionCardStyles(theme);
  const color = Colors[theme];

  return (
    <View>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.optionCard, selectedValue === option.value && styles.optionCardSelected]}
          onPress={() => onSelect(option.value)}
        >
          <View style={styles.optionCardHeader}>
            <Text style={styles.optionCardTitle}>{option.label}</Text>
            {selectedValue === option.value && (
              <Ionicons name="checkmark-circle" size={24} color={color.primary} />
            )}
          </View>
          <Text style={styles.optionCardDescription}>{option.description}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
