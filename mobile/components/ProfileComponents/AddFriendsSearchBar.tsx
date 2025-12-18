import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsSearchBarStyles } from './AddFriendsSearchBar.styles';
import { AddFriendsSearchBarProps } from './AddFriendsSearchBar.config';

export default function AddFriendsSearchBar({
  searchText,
  onSearchChange,
  searchFocused,
  onSearchFocus,
}: AddFriendsSearchBarProps) {
  const theme = useColorTheme();
  const styles = addFriendsSearchBarStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          searchFocused ? styles.searchContainerFocused : styles.searchContainerBlurred,
        ]}
      >
        <FontAwesome name="search" size={16} color={color.primary} />
        <TextInput
          placeholder="Search by username or name..."
          placeholderTextColor={color.subText}
          value={searchText}
          onChangeText={onSearchChange}
          onFocus={() => onSearchFocus(true)}
          onBlur={() => onSearchFocus(false)}
          style={styles.input}
        />
        {searchText.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={() => onSearchChange('')}>
            <FontAwesome name="times-circle" size={16} color={color.subText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
