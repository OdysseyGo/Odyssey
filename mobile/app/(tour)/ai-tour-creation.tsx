import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { aiTourCreationStyles } from './ai-tour-creation.styles';
import {
  FormInputGroup,
  FormTextInput,
  FormTextArea,
  FormOptionCard,
  FormDurationPicker,
} from '@/components/TourCreation';
import {
  AICreationHeader,
  ThemeSuggestions,
  LanguageSelector,
  GenerateButton,
  LoadingOverlay,
  InfoCard,
  AITourFormData,
  TOUR_MODE_OPTIONS,
  createEmptyFormData,
} from '@/components/AITourCreation';
import { generateAITour } from '@/api/aiTours';

export default function AITourCreation() {
  const theme = useColorTheme();
  const styles = aiTourCreationStyles(theme);

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AITourFormData>(createEmptyFormData());

  const updateFormData = (updates: Partial<AITourFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const isFormValid = formData.city.trim() !== '' && formData.theme.trim() !== '';

  const handleGenerate = async () => {
    if (!isFormValid) {
      Alert.alert('Missing Information', 'Please provide both a city and a theme for your tour.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await generateAITour({
        city: formData.city.trim(),
        theme: formData.theme.trim(),
        mode: formData.mode,
        duration: formData.duration,
        language: formData.language,
        additional_details: formData.additionalDetails.trim() || undefined,
      });

      Alert.alert('Tour Created! 🎉', response.message, [
        {
          text: 'View Tour',
          onPress: () => router.replace(`/tour/${response.tour_id}`),
        },
        {
          text: 'Create Another',
          style: 'cancel',
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Generation Failed',
        error?.message || 'Something went wrong while generating your tour. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <AICreationHeader />

          {/* City Input */}
          <FormInputGroup label="City" required>
            <FormTextInput
              value={formData.city}
              onChangeText={(text) => updateFormData({ city: text })}
              placeholder="e.g., Istanbul, Paris, Tokyo"
              autoCapitalize="words"
            />
          </FormInputGroup>

          {/* Theme Input */}
          <FormInputGroup label="Tour Theme" required>
            <FormTextInput
              value={formData.theme}
              onChangeText={(text) => updateFormData({ theme: text })}
              placeholder="e.g., Haunted History, Hidden Gems"
            />
            <ThemeSuggestions
              onSelect={(selectedTheme) => updateFormData({ theme: selectedTheme })}
            />
          </FormInputGroup>

          <View style={styles.sectionDivider} />

          {/* Tour Mode */}
          <View>
            <Text style={styles.sectionTitle}>Tour Mode</Text>
            <Text style={styles.sectionSubtitle}>Choose the type of experience</Text>
            <FormOptionCard
              options={TOUR_MODE_OPTIONS}
              selectedValue={formData.mode}
              onSelect={(value) => updateFormData({ mode: value as AITourFormData['mode'] })}
            />
          </View>

          <View style={styles.sectionDivider} />

          {/* Duration */}
          <FormInputGroup label="Estimated Duration">
            <FormDurationPicker
              value={formData.duration}
              onChange={(duration) => updateFormData({ duration })}
              min={15}
              max={180}
              step={15}
            />
            <InfoCard message="Longer tours will have more stops. AI will create approximately one location per 15 minutes." />
          </FormInputGroup>

          <View style={styles.sectionDivider} />

          {/* Language Selection */}
          <LanguageSelector
            selectedLanguage={formData.language}
            onSelect={(language) => updateFormData({ language })}
          />

          <View style={styles.sectionDivider} />

          {/* Additional Details */}
          <FormInputGroup label="Additional Details (Optional)">
            <FormTextArea
              value={formData.additionalDetails}
              onChangeText={(text) => updateFormData({ additionalDetails: text })}
              placeholder="Any specific preferences? e.g., 'Focus on medieval architecture', 'Include cafes for breaks', 'Avoid steep hills'..."
              numberOfLines={4}
            />
          </FormInputGroup>
        </ScrollView>

        {/* Footer with Generate Button */}
        <GenerateButton onPress={handleGenerate} disabled={!isFormValid} isLoading={isLoading} />
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}
