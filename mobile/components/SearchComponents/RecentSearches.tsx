import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { recentSearchesStyles } from './RecentSearches.styles';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

interface RecentSearchesProps {
  searches: string[];
  onSearchPress: (query: string) => void;
  onRemoveSearch?: (query: string) => void;
  onClearAll: () => void;
  title?: string;
}

export default function RecentSearches({
  searches,
  onSearchPress,
  onRemoveSearch,
  onClearAll,
  title,
}: RecentSearchesProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => recentSearchesStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  if (searches.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title || t('search.recentSearch')}</Text>
        <Pressable onPress={onClearAll}>
          <Text style={styles.clearAllText}>{t('search.clearAll')}</Text>
        </Pressable>
      </View>
      {searches.map((search, index) => (
        <Pressable key={index} style={styles.searchItem} onPress={() => onSearchPress(search)}>
          <FontAwesome name="clock-o" size={18} color={colors.subText} style={styles.searchIcon} />
          <Text style={styles.searchText}>{search}</Text>
          {onRemoveSearch ? (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onRemoveSearch(search);
              }}
              hitSlop={10}
              style={styles.removeButton}
            >
              <FontAwesome name="times-circle" size={16} color={colors.subText} />
            </Pressable>
          ) : null}
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
