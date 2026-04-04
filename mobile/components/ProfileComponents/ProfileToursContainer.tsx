import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileToursContainerStyles } from './ProfileToursContainer.styles';
import { ProfileToursContainerProps, TOUR_TABS, TourTab } from './ProfileToursContainer.config';
import { Tour, TourStatus, getMyTours } from '@/api/tours';
import ProfileTourCard from './ProfileTourCard';
import { useTranslation } from 'react-i18next';

export default function ProfileToursContainer({}: ProfileToursContainerProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => profileToursContainerStyles(theme), [theme]);
  const color = Colors[theme];
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TourStatus>('PUBLISHED');
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Text style={styles.title}>{t('profile.myTours')}</Text>
      </View>

      {/* Tabs */}
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
            <ProfileTourCard key={tour.id} tour={tour} />
          ))}
        </View>
      )}
    </View>
  );
}
