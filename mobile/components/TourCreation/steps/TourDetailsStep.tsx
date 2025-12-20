import React from 'react';
import { Text, ScrollView } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourDetailsStepStyles } from './TourDetailsStep.styles';
import {
  TourCreationData,
  TOUR_CATEGORIES,
  DIFFICULTY_OPTIONS,
  TOUR_TYPE_OPTIONS,
} from '../TourCreation.types';
import {
  FormInputGroup,
  FormTextInput,
  FormTextArea,
  FormChipSelect,
  FormOptionCard,
  FormDurationPicker,
} from '../inputs';

type TourDetailsStepProps = {
  tourData: TourCreationData;
  onUpdate: (updates: Partial<TourCreationData>) => void;
};

export default function TourDetailsStep({ tourData, onUpdate }: TourDetailsStepProps) {
  const theme = useColorTheme();
  const styles = tourDetailsStepStyles(theme);

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>Tour Details</Text>
      <Text style={styles.sectionSubtitle}>Provide basic information about your tour</Text>

      <FormInputGroup label="Tour Title" required>
        <FormTextInput
          value={tourData.title}
          onChangeText={(text) => onUpdate({ title: text })}
          placeholder="e.g., Hidden Gems of Old Town"
        />
      </FormInputGroup>

      <FormInputGroup label="Description" required>
        <FormTextArea
          value={tourData.description}
          onChangeText={(text) => onUpdate({ description: text })}
          placeholder="Describe what makes your tour special..."
        />
      </FormInputGroup>

      <FormInputGroup label="City">
        <FormTextInput
          value={tourData.city}
          onChangeText={(text) => onUpdate({ city: text })}
          placeholder="e.g., Istanbul, Tokyo, Paris"
        />
      </FormInputGroup>

      <FormInputGroup label="Category" required>
        <FormChipSelect
          options={TOUR_CATEGORIES}
          selectedValue={tourData.category}
          onSelect={(category) => onUpdate({ category })}
        />
      </FormInputGroup>

      <FormInputGroup label="Difficulty">
        <FormOptionCard
          options={DIFFICULTY_OPTIONS}
          selectedValue={tourData.difficulty}
          onSelect={(value) => onUpdate({ difficulty: value as 'EASY' | 'MEDIUM' | 'HARD' })}
        />
      </FormInputGroup>

      <FormInputGroup label="Tour Type">
        <FormOptionCard
          options={TOUR_TYPE_OPTIONS}
          selectedValue={tourData.tourType}
          onSelect={(value) => onUpdate({ tourType: value as 'STORY' | 'PUZZLE' | 'HYBRID' })}
        />
      </FormInputGroup>

      <FormInputGroup label="Estimated Duration">
        <FormDurationPicker
          value={tourData.estimatedDuration}
          onChange={(estimatedDuration) => onUpdate({ estimatedDuration })}
        />
      </FormInputGroup>
    </ScrollView>
  );
}
