import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  SearchHeader,
  SearchResult,
  RecentSearches,
  SearchResultItemProps,
} from '@/components/SearchComponents';
import { searchScreenStyles } from './search.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { searchTours, Tour } from '@/api/tours';
import {
  clearSearchHistory,
  getSearchHistory,
  saveSearchHistory,
  searchUsers,
  User,
} from '@/api/users';
import { getAuthToken } from '@/api/auth';

type SearchMode = 'tours' | 'users';
type RecentSearchesByMode = Record<SearchMode, string[]>;

const RECENT_SEARCHES_STORAGE_KEY = 'odyssey:recent-searches:v1';
const MAX_RECENT_SEARCHES = 8;

// Convert API Tour to SearchResultItemProps
function mapTourToSearchResult(tour: Tour, t: (key: string) => string): SearchResultItemProps {
  return {
    id: tour.id.toString(),
    image: tour.steps?.[0]?.image || `https://picsum.photos/400/320?random=${tour.id}`,
    title: tour.title,
    author: tour.creator?.username || t('search.unknownAuthor'),
    duration: `${tour.duration_minutes} ${t('tourId.min')}`,
    rating: tour.average_rating?.toFixed(1) || t('search.notAvailable'),
    location: tour.city || t('search.unknownLocation'),
  };
}

export default function SearchScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => searchScreenStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('tours');
  const [recentSearches, setRecentSearches] = useState<RecentSearchesByMode>({
    tours: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [tourResults, setTourResults] = useState<SearchResultItemProps[]>([]);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRecentSearches = async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          const [tourSearches, userSearches] = await Promise.all([
            getSearchHistory('tours'),
            getSearchHistory('users'),
          ]);
          if (!mounted) return;
          setRecentSearches({
            tours: tourSearches.map((item) => item.query),
            users: userSearches.map((item) => item.query),
          });
          return;
        }
      } catch {}

      try {
        const value = await AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY);
        if (!value || !mounted) return;
        const parsed = JSON.parse(value) as Partial<RecentSearchesByMode>;
        setRecentSearches({
          tours: Array.isArray(parsed.tours) ? parsed.tours : [],
          users: Array.isArray(parsed.users) ? parsed.users : [],
        });
      } catch {}
    };

    loadRecentSearches();

    return () => {
      mounted = false;
    };
  }, []);

  const persistRecentSearches = useCallback((nextSearches: RecentSearchesByMode) => {
    AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(nextSearches)).catch(() => {});
  }, []);

  const persistSearchToDatabase = useCallback(async (query: string, mode: SearchMode) => {
    const token = await getAuthToken();
    if (!token) return;
    saveSearchHistory(mode, query).catch(() => {});
  }, []);

  const rememberSearch = useCallback(
    (query: string, mode: SearchMode = searchMode) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setRecentSearches((current) => {
        const nextForMode = [
          trimmed,
          ...current[mode].filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
        ].slice(0, MAX_RECENT_SEARCHES);
        const next = { ...current, [mode]: nextForMode };
        persistRecentSearches(next);
        persistSearchToDatabase(trimmed, mode);
        return next;
      });
    },
    [persistRecentSearches, persistSearchToDatabase, searchMode]
  );

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTourResults([]);
      setUserResults([]);
      setError(null);
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (searchMode === 'tours') {
          const response = await searchTours(searchQuery, { page_size: 20 }, abortController.signal);
          setTourResults(response.results.map((tour) => mapTourToSearchResult(tour, t)));
          setUserResults([]);
          rememberSearch(searchQuery, 'tours');
        } else {
          const response = await searchUsers(searchQuery, abortController.signal);
          setUserResults(response.results);
          setTourResults([]);
          rememberSearch(searchQuery, 'users');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Search failed');
          setTourResults([]);
          setUserResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [rememberSearch, searchMode, searchQuery, t]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setTourResults([]);
    setUserResults([]);
    setError(null);
  }, []);

  const handleRecentSearchPress = useCallback((query: string) => {
    setSearchQuery(query);
    rememberSearch(query);
  }, [rememberSearch]);

  const handleSubmitSearch = useCallback(() => {
    rememberSearch(searchQuery);
  }, [rememberSearch, searchQuery]);

  const handleModeChange = useCallback((mode: SearchMode) => {
    setSearchMode(mode);
    setError(null);
  }, []);

  const handleClearRecentSearches = useCallback(() => {
    setRecentSearches((current) => {
      const next = { ...current, [searchMode]: [] };
      persistRecentSearches(next);
      getAuthToken()
        .then((token) => {
          if (token) clearSearchHistory(searchMode).catch(() => {});
        })
        .catch(() => {});
      return next;
    });
  }, [persistRecentSearches, searchMode]);

  const handleUserPress = useCallback(
    (user: User) => {
      rememberSearch(searchQuery);
      router.dismiss();
      router.push({
        pathname: '/profile/[userId]',
        params: { userId: user.id.toString() },
      });
    },
    [rememberSearch, searchQuery]
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="search" size={48} color={colors.subText} style={styles.emptyIcon} />
      <Text style={styles.emptyText}>
        {searchMode === 'tours' ? t('search.noToursFound') : t('search.noUsersFound')}
      </Text>
      <Text style={styles.emptySubText}>
        {searchMode === 'tours' ? t('search.noToursFoundSub') : t('search.noUsersFoundSub')}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.emptyContainer}>
      <FontAwesome
        name="exclamation-circle"
        size={48}
        color={colors.error}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyText}>{t('search.searchFailed')}</Text>
      <Text style={styles.emptySubText}>{error}</Text>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>
        {searchMode === 'tours' ? t('search.searching') : t('search.searchingUsers')}
      </Text>
    </View>
  );

  const renderUserResult = (user: User) => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

    return (
      <Pressable
        key={user.id}
        onPress={() => handleUserPress(user)}
        style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.7 }]}
      >
        {user.avatar_url ? (
          <Image source={{ uri: user.avatar_url }} style={styles.userAvatar} />
        ) : (
          <View style={styles.userAvatarFallback}>
            <FontAwesome name="user" size={22} color={colors.primary} />
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            @{user.username}
          </Text>
          {fullName ? (
            <Text style={styles.userFullName} numberOfLines={1}>
              {fullName}
            </Text>
          ) : null}
          <Text style={styles.userMeta}>
            {t('search.userMeta', {
              followers: user.follower_count ?? 0,
              tours: user.tour_count ?? 0,
            })}
          </Text>
        </View>
        <FontAwesome name="arrow-right" size={14} color={colors.subText} />
      </Pressable>
    );
  };

  const renderResults = () => (
    <View style={styles.resultsContainer}>
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>{t('search.results')}</Text>
        <Text style={styles.resultsCount}>
          {searchMode === 'tours'
            ? t('search.toursCount', { count: tourResults.length })
            : t('search.usersCount', { count: userResults.length })}
        </Text>
      </View>
      {searchMode === 'tours'
        ? tourResults.map((tour) => <SearchResult key={tour.id} {...tour} />)
        : userResults.map(renderUserResult)}
    </View>
  );

  const activeRecentSearches = recentSearches[searchMode];
  const activeResultCount = searchMode === 'tours' ? tourResults.length : userResults.length;
  const showRecentSearches = !searchQuery.trim() && activeRecentSearches.length > 0;
  const showEmptyState = searchQuery.trim() && !isLoading && !error && activeResultCount === 0;
  const showResults = searchQuery.trim() && !isLoading && !error && activeResultCount > 0;
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
        onSubmit={handleSubmitSearch}
        mode={searchMode}
        onModeChange={handleModeChange}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {showRecentSearches && (
          <RecentSearches
            searches={activeRecentSearches}
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
