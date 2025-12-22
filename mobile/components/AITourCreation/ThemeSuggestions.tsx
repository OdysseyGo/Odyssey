import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { themeSuggestionsStyles } from './ThemeSuggestions.styles';
import { THEME_SUGGESTIONS } from './AITourCreation.types';

type ThemeSuggestionsProps = {
  onSelect: (theme: string) => void;
  suggestions?: readonly string[];
};

export default function ThemeSuggestions({
  onSelect,
  suggestions = THEME_SUGGESTIONS,
}: ThemeSuggestionsProps) {
  const theme = useColorTheme();
  const styles = themeSuggestionsStyles(theme);

  return (
    <View style={styles.container}>
      {suggestions.map((suggestion) => (
        <TouchableOpacity key={suggestion} style={styles.chip} onPress={() => onSelect(suggestion)}>
          <Text style={styles.chipText}>{suggestion}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
