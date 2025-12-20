import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourStoriesStepStyles } from './TourStoriesStep.styles';
import Colors from '@/constants/Colors';
import { TourLocation } from '../TourCreation.types';

type TourStoriesStepProps = {
  locations: TourLocation[];
  onLocationSelect: (location: TourLocation) => void;
};

export default function TourStoriesStep({ locations, onLocationSelect }: TourStoriesStepProps) {
  const theme = useColorTheme();
  const styles = tourStoriesStepStyles(theme);
  const color = Colors[theme];

  if (locations.length === 0) {
    return (
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={color.subText} />
          <Text style={styles.emptyStateText}>
            No locations added yet.{'\n'}Go back and add some locations first.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Write Your Stories</Text>
      <Text style={styles.sectionSubtitle}>
        Add a compelling story for each location in your tour
      </Text>

      {locations.map((location) => {
        const isComplete = location.title.trim().length > 0 && location.story.trim().length > 0;
        return (
          <TouchableOpacity
            key={location.id}
            style={[styles.locationCard, isComplete && styles.locationCardComplete]}
            onPress={() => onLocationSelect(location)}
          >
            <View style={styles.locationCardHeader}>
              <View style={styles.locationCardLeft}>
                <View style={styles.locationOrderBadge}>
                  <Text style={styles.locationOrderText}>{location.order}</Text>
                </View>
                <Text style={styles.locationCardTitle}>
                  {location.title || 'Untitled Location'}
                </Text>
              </View>
              <Ionicons
                name={isComplete ? 'checkmark-circle' : 'create-outline'}
                size={24}
                color={isComplete ? color.primary : color.subText}
              />
            </View>
            <Text style={styles.locationCardDescription} numberOfLines={2}>
              {location.story || 'Tap to add a story for this location'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
