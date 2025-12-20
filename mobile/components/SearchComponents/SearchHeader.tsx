import { View, TextInput, Pressable } from 'react-native';
import { useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { searchHeaderStyles } from './SearchHeader.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
}

export default function SearchHeader({ searchQuery, onSearchChange, onClear }: SearchHeaderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => searchHeaderStyles(theme), [theme]);
  const colors = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search tours, destinations..."
          placeholderTextColor={colors.placeholderTextColor}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={onClear} style={styles.clearButton}>
            <FontAwesome name="times-circle" size={18} color={colors.placeholder} />
          </Pressable>
        )}
      </View>
    </View>
  );
}
