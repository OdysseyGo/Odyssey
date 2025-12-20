import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { recentSearchesStyles } from './RecentSearches.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

interface RecentSearchesProps {
  searches: string[];
  onSearchPress: (query: string) => void;
  onClearAll: () => void;
}

export default function RecentSearches({
  searches,
  onSearchPress,
  onClearAll,
}: RecentSearchesProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => recentSearchesStyles(theme), [theme]);
  const colors = Colors[theme];

  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Searches</Text>
        <Pressable onPress={onClearAll}>
          <Text style={styles.clearAllText}>Clear All</Text>
        </Pressable>
      </View>
      {searches.map((search, index) => (
        <Pressable
          key={index}
          style={styles.searchItem}
          onPress={() => onSearchPress(search)}
        >
          <FontAwesome
            name="clock-o"
            size={18}
            color={colors.subText}
            style={styles.searchIcon}
          />
          <Text style={styles.searchText}>{search}</Text>
          <FontAwesome
            name="arrow-right"
            size={14}
            color={colors.subText}
            style={styles.arrowIcon}
          />
        </Pressable>
      ))}
    </View>
  );
}
