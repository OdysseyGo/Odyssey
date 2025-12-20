import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
  SearchHeader,
  SearchResult,
  RecentSearches,
  mockSearchResults,
  recentSearches as initialRecentSearches,
} from '@/components/SearchComponents';
import { searchScreenStyles } from './search.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

export default function SearchScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => searchScreenStyles(theme), [theme]);
  const colors = Colors[theme];

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(initialRecentSearches);
  const [isLoading, setIsLoading] = useState(false);

  // Filter mock results based on search query - will be replaced by API
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    return mockSearchResults.filter(
      (tour) =>
        tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tour.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    // Simulate API loading - remove when real API is connected
    if (query.trim()) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 300);
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome
        name="search"
        size={48}
        color={colors.subText}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyText}>No tours found</Text>
      <Text style={styles.emptySubText}>
        Try searching for a different destination, tour name, or guide
      </Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>Searching tours...</Text>
    </View>
  );

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>Search Results</Text>
        <Text style={styles.resultsCount}>{searchResults.length} tours</Text>
      </View>
      {searchResults.map((tour) => (
        <SearchResult key={tour.id} {...tour} />
      ))}
    </View>
  );

  const showRecentSearches = !searchQuery.trim() && recentSearches.length > 0;
  const showEmptyState = searchQuery.trim() && !isLoading && searchResults.length === 0;
  const showResults = searchQuery.trim() && !isLoading && searchResults.length > 0;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <SearchHeader
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClear={handleClearSearch}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {showRecentSearches && (
          <RecentSearches
            searches={recentSearches}
            onSearchPress={handleRecentSearchPress}
            onClearAll={handleClearRecentSearches}
          />
        )}

        {isLoading && renderLoading()}
        {showEmptyState && renderEmptyState()}
        {showResults && renderResults()}
      </ScrollView>
    </View>
  );
}
