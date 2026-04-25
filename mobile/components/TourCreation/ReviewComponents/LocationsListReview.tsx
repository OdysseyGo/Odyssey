import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationsListReviewStyles } from './LocationsListReview.styles';
import { TourLocation } from '../TourCreation.types';
import { useTranslation } from 'react-i18next';

type LocationsListReviewProps = {
  locations: TourLocation[];
};

export default function LocationsListReview({ locations }: LocationsListReviewProps) {
  const theme = useColorTheme();
  const styles = locationsListReviewStyles(theme);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {t('creation.review.tourStopsTitle', { count: locations.length })}
      </Text>

      {locations.map((location) => (
        <View key={location.id} style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationOrderBadge}>
              <Text style={styles.locationOrder}>{location.order}</Text>
            </View>
            <View style={styles.locationTitleWrap}>
              <Text style={styles.locationTitle} numberOfLines={2} ellipsizeMode="tail">
                {location.title}
              </Text>
              <View style={styles.locationMeta}>
                <Ionicons name="checkmark-circle" size={14} style={styles.locationMetaIcon} />
                <Text style={styles.locationMetaText}>
                  {t('creation.review.readyStop', { defaultValue: 'Ready stop' })}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.locationStory} numberOfLines={3}>
            {location.story}
          </Text>
        </View>
      ))}
    </View>
  );
}
