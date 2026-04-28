import { View, Text, TextInput, Pressable } from 'react-native';
import { useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';

import { searchHeaderStyles } from './SearchHeader.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
  onSubmit: () => void;
  mode: 'tours' | 'users';
  onModeChange: (mode: 'tours' | 'users') => void;
}

export default function SearchHeader({
  searchQuery,
  onSearchChange,
  onClear,
  onSubmit,
  mode,
  onModeChange,
}: SearchHeaderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => searchHeaderStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        {(['tours', 'users'] as const).map((item) => {
          const isActive = mode === item;
          return (
            <Pressable
              key={item}
              onPress={() => onModeChange(item)}
              style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                {item === 'tours' ? t('search.toursTab') : t('search.usersTab')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.searchContainer}>
        <FontAwesome name="search" size={18} color={colors.placeholder} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder={mode === 'tours' ? t('search.placeholder') : t('search.userPlaceholder')}
          placeholderTextColor={colors.placeholderTextColor}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={onSubmit}
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
