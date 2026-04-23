import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileToursContainerStyles } from './ProfileToursContainer.styles';
import { TOUR_TABS, TourTab } from './ProfileToursContainer.config';
import { Tour, TourStatus, getMyTours } from '@/api/tours';
import { getCurrentUser } from '@/api/auth';
import ProfileTourCard from './ProfileTourCard';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

export default function ProfileToursContainer() {
  const theme = useColorTheme();
  const styles = useMemo(() => profileToursContainerStyles(theme), [theme]);
  const color = Colors[theme];
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TourStatus>('PUBLISHED');
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((user) => {
        if (!cancelled) setCurrentUserId(user?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchTours = useCallback(async (status: TourStatus) => {
    setLoading(true);
    try {
      const response = await getMyTours(status);
      setTours(response.results);
    } catch (error) {
      console.error('Failed to fetch tours:', error);
      setTours([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTours(activeTab);
  }, [activeTab, fetchTours]);

  const handleTabChange = (tab: TourTab) => {
    setActiveTab(tab.key);
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'PUBLISHED':
        return t('profile.emptyPublished');
      case 'DRAFT':
        return t('profile.emptyDraft');
      case 'ARCHIVED':
        return t('profile.emptyArchived');
      default:
        return t('profile.emptyDefault');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.accentBar} />
          <Text style={styles.title}>{t('profile.myTours')}</Text>
        </View>
      </View>

      {/* Segmented control */}
      <View style={styles.tabsContainer}>
        {TOUR_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => handleTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {t(tab.label)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={color.primary} />
        </View>
      ) : tours.length === 0 ? (
        <Text style={styles.emptyStateText}>{getEmptyMessage()}</Text>
      ) : (
        <View style={styles.toursList}>
          {tours.map((tour) => (
            <View key={tour.id}>
              <ProfileTourCard
                tour={tour}
                onPress={() =>
                  router.push({
                    pathname: '/tour/[id]',
                    params: { id: tour.id.toString() },
                  })
                }
              />
              {currentUserId !== null && tour.creator?.id === currentUserId && (
                <View style={styles.tourActionsRow}>
                  <TouchableOpacity
                    style={styles.editActionButton}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/tour-details',
                        params: { tourId: tour.id.toString() },
                      })
                    }
                  >
                    <Ionicons name="create-outline" size={14} color={color.primary} />
                    <Text style={styles.editActionText}>
                      {t('profile.editTour', { defaultValue: 'Edit Tour' })}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
