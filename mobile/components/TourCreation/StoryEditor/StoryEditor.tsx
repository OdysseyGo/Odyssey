import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { storyEditorStyles } from './StoryEditor.styles';
import { TourLocation } from '../TourCreation.types';
import StoryEditorHeader from './StoryEditorHeader';
import LocationBadge from './LocationBadge';
import StoryInputField from './StoryInputField';
import ImageUploadSection from './ImageUploadSection';
import WritingTips from './WritingTips';
import StoryEditorFooter from './StoryEditorFooter';
import { useColorTheme } from '@/utils/useColorTheme';

type StoryEditorProps = {
  location: TourLocation;
  onSave: (updatedLocation: TourLocation) => void;
  onCancel: () => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  totalLocations: number;
};

export default function StoryEditor({
  location,
  onSave,
  onCancel,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  totalLocations,
}: StoryEditorProps) {
  const theme = useColorTheme();
  const styles = storyEditorStyles(theme);

  const [title, setTitle] = useState(location.title);
  const [address, setAddress] = useState(location.address || '');
  const [story, setStory] = useState(location.story);
  const [image, setImage] = useState<string | undefined>(location.image);

  useEffect(() => {
    setTitle(location.title);
    setAddress(location.address || '');
    setStory(location.story);
    setImage(location.image);
  }, [location]);

  const handleSave = () => {
    onSave({
      ...location,
      title,
      address,
      story,
      image,
    });
  };

  const isValid = title.trim().length > 0 && story.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StoryEditorHeader onClose={onCancel} onSave={handleSave} isValid={isValid} />

        <ScrollView style={styles.scrollContent}>
          <LocationBadge currentStop={location.order} totalStops={totalLocations} />

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
          onNavigatePrev={onNavigatePrev}
          onNavigateNext={onNavigateNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
          isValid={isValid}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
