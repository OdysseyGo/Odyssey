import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import {
  SearchHeader,
  SearchResult,
  RecentSearches,
  SearchResultItemProps,
  recentSearches as initialRecentSearches,
} from '@/components/SearchComponents';
import { searchScreenStyles } from './search.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { searchTours, Tour } from '@/api/tours';

// Convert API Tour to SearchResultItemProps
function mapTourToSearchResult(tour: Tour): SearchResultItemProps {
  return {
    id: tour.id.toString(),
    image: tour.steps?.[0]?.image || `https://picsum.photos/400/320?random=${tour.id}`,
    title: tour.title,
    author: tour.creator?.username || 'Unknown',
    duration: `${tour.duration_minutes} min`,
    rating: tour.average_rating?.toFixed(1) || 'N/A',
    location: tour.city || 'Unknown location',
  };
}

export default function SearchScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => searchScreenStyles(theme), [theme]);
  const colors = Colors[theme];

  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(initialRecentSearches);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItemProps[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await searchTours(searchQuery, { page_size: 20 }, abortController.signal);
        setSearchResults(response.results.map(mapTourToSearchResult));
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Search failed');
          setSearchResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="search" size={48} color={colors.subText} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>No tours found</Text>
      <Text style={styles.emptySubText}>
        Try searching for a different destination, tour name, or guide
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="exclamation-circle" size={48} color={colors.error} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>Search failed</Text>
      <Text style={styles.emptySubText}>{error}</Text>
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
  const showEmptyState = searchQuery.trim() && !isLoading && !error && searchResults.length === 0;
  const showResults = searchQuery.trim() && !isLoading && !error && searchResults.length > 0;
  const showError = searchQuery.trim() && !isLoading && error !== null;

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
        {showError && renderError()}
        {showEmptyState && renderEmptyState()}
        {showResults && renderResults()}
      </ScrollView>
    </View>
  );
}
