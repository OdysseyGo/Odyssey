import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import LocationBadge from '@/components/TourCreation/StoryEditor/LocationBadge';
import StoryInputField from '@/components/TourCreation/StoryEditor/StoryInputField';
import ImageUploadSection from '@/components/TourCreation/StoryEditor/ImageUploadSection';
import WritingTips from '@/components/TourCreation/StoryEditor/WritingTips';
import StoryEditorFooter from '@/components/TourCreation/StoryEditor/StoryEditorFooter';
import PuzzleEditor from '@/components/TourCreation/StoryEditor/PuzzleEditor';
import { CreationHeader } from '@/components/TourCreation/common';
import { Puzzle } from '@/components/TourCreation';
import { useTranslation } from 'react-i18next';

export default function EditLocationScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, selectedLocation, setSelectedLocation, updateLocation } = useTourCreation();
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [story, setStory] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [puzzle, setPuzzle] = useState<Puzzle | undefined>(undefined);

  const isPuzzleMode = tourData.tourType === 'PUZZLE' || tourData.tourType === 'HYBRID';

  useEffect(() => {
    if (selectedLocation) {
      setTitle(selectedLocation.title);
      setAddress(selectedLocation.address || '');
      setStory(selectedLocation.story);
      setImage(selectedLocation.image);
      setPuzzle(selectedLocation.puzzle);
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
        puzzle: isPuzzleMode ? puzzle : undefined,
      });
      setSelectedLocation(null);
      router.back();
    }
  }, [
    selectedLocation,
    title,
    address,
    story,
    image,
    puzzle,
    updateLocation,
    setSelectedLocation,
    isPuzzleMode,
  ]);

  const handleNavigateLocation = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedLocation) return;

      updateLocation({
        ...selectedLocation,
        title,
        address,
        story,
        image,
        puzzle: isPuzzleMode ? puzzle : undefined,
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
      puzzle,
      updateLocation,
      setSelectedLocation,
      isPuzzleMode,
    ]
  );

  const isPuzzleValid = (currentPuzzle?: Puzzle) => {
    if (!currentPuzzle?.question) {
      return false;
    }

    if (currentPuzzle.puzzle_type === 'PICTURE_COMPARE') {
      return !!currentPuzzle.referenceImage;
    }

    const options = currentPuzzle.options;
    if (!currentPuzzle.correctAnswer || !options || options.length < 2) {
      return false;
    }

    return options.every((opt) => opt.trim().length > 0);
  };

  const shouldValidatePuzzle = tourData.tourType === 'PUZZLE' || !!puzzle;
  const isValid =
    title.trim().length > 0 &&
    story.trim().length > 0 &&
    (!shouldValidatePuzzle || isPuzzleValid(puzzle));

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
      <CreationHeader title={t('creation.editLocation.header')} />
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
            label={t('creation.editLocation.titleLabel')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('creation.editLocation.titlePlaceholder')}
          />

          <StoryInputField
            label={t('creation.editLocation.addressLabel')}
            value={address}
            onChangeText={setAddress}
            placeholder={t('creation.editLocation.addressPlaceholder')}
          />

          <ImageUploadSection image={image} onImageChange={setImage} />

          <StoryInputField
            label={t('creation.editLocation.storyLabel')}
            value={story}
            onChangeText={setStory}
            placeholder={t('creation.editLocation.storyPlaceholder')}
            hint={t('creation.editLocation.storyHint')}
            multiline
            showCharacterCount
          />

          {isPuzzleMode && (
            <PuzzleEditor
              puzzle={puzzle}
              onChange={setPuzzle}
              isRequired={tourData.tourType === 'PUZZLE'}
            />
          )}

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
