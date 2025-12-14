import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import LocationBadge from '@/components/TourCreation/StoryEditor/LocationBadge';
import StoryInputField from '@/components/TourCreation/StoryEditor/StoryInputField';
import ImageUploadSection from '@/components/TourCreation/StoryEditor/ImageUploadSection';
import WritingTips from '@/components/TourCreation/StoryEditor/WritingTips';
import StoryEditorFooter from '@/components/TourCreation/StoryEditor/StoryEditorFooter';

export default function EditLocationScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const navigation = useNavigation();
  const { tourData, selectedLocation, setSelectedLocation, updateLocation } = useTourCreation();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [story, setStory] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);

  // Initialize form with selected location data
  useEffect(() => {
    if (selectedLocation) {
      setTitle(selectedLocation.title);
      setAddress(selectedLocation.address || '');
      setStory(selectedLocation.story);
      setImage(selectedLocation.image);
    }
  }, [selectedLocation]);

  const handleSave = useCallback(() => {
    if (selectedLocation) {
      updateLocation({
        ...selectedLocation,
        title,
        address,
        story,
        image,
      });
      setSelectedLocation(null);
      router.back();
    }
  }, [selectedLocation, title, address, story, image, updateLocation, setSelectedLocation]);

  const handleNavigateLocation = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedLocation) return;

      // Save current location first
      updateLocation({
        ...selectedLocation,
        title,
        address,
        story,
        image,
      });

      const currentIndex = tourData.locations.findIndex((loc) => loc.id === selectedLocation.id);
      const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

      if (newIndex >= 0 && newIndex < tourData.locations.length) {
        setSelectedLocation(tourData.locations[newIndex]);
      }
    },
    [
      selectedLocation,
      tourData.locations,
      title,
      address,
      story,
      image,
      updateLocation,
      setSelectedLocation,
    ]
  );

  // Update header title
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Edit Location',
    });
  }, [navigation]);

  const isValid = title.trim().length > 0 && story.trim().length > 0;

  const currentIndex = selectedLocation
    ? tourData.locations.findIndex((loc) => loc.id === selectedLocation.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < tourData.locations.length - 1;

  if (!selectedLocation) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContainer}>
          <LocationBadge
            currentStop={selectedLocation.order}
            totalStops={tourData.locations.length}
          />

          <StoryInputField
            label="Location Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., The Grand Bazaar Entrance"
          />

          <StoryInputField
            label="Address (Optional)"
            value={address}
            onChangeText={setAddress}
            placeholder="e.g., 123 Main Street, Istanbul"
          />

          <ImageUploadSection image={image} onImageChange={setImage} />

          <StoryInputField
            label="Story *"
            value={story}
            onChangeText={setStory}
            placeholder="Tell the story of this location..."
            hint="Write the narrative that visitors will read or hear at this location"
            multiline
            showCharacterCount
          />

          <WritingTips />
        </ScrollView>

        <StoryEditorFooter
          onSave={handleSave}
          onNavigatePrev={() => handleNavigateLocation('prev')}
          onNavigateNext={() => handleNavigateLocation('next')}
          hasPrev={hasPrev}
          hasNext={hasNext}
          isValid={isValid}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
});
