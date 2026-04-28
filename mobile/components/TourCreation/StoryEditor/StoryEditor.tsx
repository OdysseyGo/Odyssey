import React, { useState, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { storyEditorStyles } from './StoryEditor.styles';
import { TourLocation, TOUR_TEXT_FIELD_MAX_LENGTH } from '../TourCreation.types';
import StoryEditorHeader from './StoryEditorHeader';
import LocationBadge from './LocationBadge';
import StoryInputField from './StoryInputField';
import ImageUploadSection from './ImageUploadSection';
import WritingTips from './WritingTips';
import StoryEditorFooter from './StoryEditorFooter';
import { useColorTheme } from '@/utils/useColorTheme';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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

        <ScrollView
          style={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <LocationBadge currentStop={location.order} totalStops={totalLocations} />

          <StoryInputField
            label={t('creation.storyEditor.locationTitle')}
            value={title}
            onChangeText={setTitle}
            placeholder={t('creation.storyEditor.locationTitlePlaceholder')}
            maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
          />

          <StoryInputField
            label={t('creation.storyEditor.address')}
            value={address}
            onChangeText={setAddress}
            placeholder={t('creation.storyEditor.addressPlaceholder')}
            maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
          />

          <ImageUploadSection image={image} onImageChange={setImage} />

          <StoryInputField
            label={t('creation.storyEditor.story')}
            value={story}
            onChangeText={setStory}
            placeholder={t('creation.storyEditor.storyPlaceholder')}
            hint={t('creation.storyEditor.storyHint')}
            multiline
            showCharacterCount
            maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
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
