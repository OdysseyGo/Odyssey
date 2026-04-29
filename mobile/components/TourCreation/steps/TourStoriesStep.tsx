import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourStoriesStepStyles } from './TourStoriesStep.styles';
import Colors from '@/constants/Colors';
import {
  TourCreationData,
  TourLocation,
  doesLocationMeetTourRequirements,
} from '../TourCreation.types';
import { useTranslation } from 'react-i18next';

type TourStoriesStepProps = {
  locations: TourLocation[];
  tourType: TourCreationData['tourType'];
  onLocationSelect: (location: TourLocation) => void;
};

export default function TourStoriesStep({
  locations,
  tourType,
  onLocationSelect,
}: TourStoriesStepProps) {
  const theme = useColorTheme();
  const styles = tourStoriesStepStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  if (locations.length === 0) {
    return (
      <View style={styles.content}>
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={48} color={color.subText} />
          <Text style={styles.emptyStateText}>{t('creation.stories.empty')}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>{t('creation.stories.title')}</Text>
      <Text style={styles.sectionSubtitle}>{t('creation.stories.subtitle')}</Text>

      {locations.map((location) => {
        const isComplete = doesLocationMeetTourRequirements(location, tourType);
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
                <Text style={styles.locationCardTitle} numberOfLines={2} ellipsizeMode="tail">
                  {location.title || t('creation.stories.untitledLocation')}
                </Text>
              </View>
              <Ionicons
                name={isComplete ? 'checkmark-circle' : 'create-outline'}
                size={24}
                color={isComplete ? color.primary : color.subText}
              />
            </View>
            <Text style={styles.locationCardDescription} numberOfLines={2}>
              {location.story || t('creation.stories.tapToAddStory')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
