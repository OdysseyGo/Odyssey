import React from 'react';
import { View, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationsListReviewStyles } from './LocationsListReview.styles';
import { TourLocation } from '../TourCreation.types';

type LocationsListReviewProps = {
  locations: TourLocation[];
};

export default function LocationsListReview({ locations }: LocationsListReviewProps) {
  const theme = useColorTheme();
  const styles = locationsListReviewStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tour Stops ({locations.length})</Text>

      {locations.map((location) => (
        <View key={location.id} style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationOrder}>{location.order}.</Text>
            <Text style={styles.locationTitle}>{location.title}</Text>
          </View>
          <Text style={styles.locationStory} numberOfLines={3}>
            {location.story}
          </Text>
        </View>
      ))}
    </View>
  );
}
