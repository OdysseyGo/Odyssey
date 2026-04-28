import React, { useState, useMemo } from 'react';
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
  FormLocationSelect,
  TOUR_TEXT_FIELD_MAX_LENGTH,
} from '@/components/TourCreation';
import {
  AICreationHeader,
  ThemeSuggestions,
  LanguageSelector,
  GenerateButton,
  LoadingOverlay,
  InfoCard,
  AITourFormData,
  createEmptyFormData,
} from '@/components/AITourCreation';
import { generateAITour } from '@/api/aiTours';
import { CreationHeader } from '@/components/TourCreation/common';
import { useTranslation } from 'react-i18next';

export default function AITourCreation() {
  const theme = useColorTheme();
  const styles = aiTourCreationStyles(theme);
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AITourFormData>(createEmptyFormData());

  const tourModeOptions = useMemo(
    () => [
      { value: 'STORY', label: t('aiTour.modes.story'), description: t('aiTour.modes.storyDesc') },
      {
        value: 'PUZZLE',
        label: t('aiTour.modes.puzzle'),
        description: t('aiTour.modes.puzzleDesc'),
      },
      {
        value: 'HYBRID',
        label: t('aiTour.modes.hybrid'),
        description: t('aiTour.modes.hybridDesc'),
      },
    ],
    [t]
  );

  const updateFormData = (updates: Partial<AITourFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const isFormValid =
    formData.country.trim() !== '' && formData.state.trim() !== '' && formData.theme.trim() !== '';

  const handleGenerate = async () => {
    if (!isFormValid) {
      Alert.alert(t('aiTour.missingInfoTitle'), t('aiTour.missingInfoMessage'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await generateAITour({
        city: formData.state.trim(),
        country: formData.country.trim(),
        country_code: formData.countryCode.trim(),
        theme: formData.theme.trim(),
        mode: formData.mode,
        duration: formData.duration,
        language: formData.language,
        additional_details: formData.additionalDetails.trim() || undefined,
      });

      Alert.alert(t('aiTour.successTitle'), response.message, [
        {
          text: t('aiTour.viewTour'),
          onPress: () => router.replace(`/tour/${response.tour_id}`),
        },
        {
          text: t('aiTour.createAnother'),
          style: 'cancel',
        },
      ]);
    } catch (error: any) {
      Alert.alert(t('aiTour.failedTitle'), error?.message || t('aiTour.failedMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <CreationHeader title={t('aiTour.header.title')} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="on-drag"
        >
          <AICreationHeader />

          <FormInputGroup
            label={t('creation.details.country', { defaultValue: 'Country' })}
            required
          >
            <FormLocationSelect
              value={formData.country}
              placeholder={t('creation.details.countryPlaceholder', {
                defaultValue: 'Search countries...',
              })}
              types="(regions)"
              onSelect={(selectedCountry) =>
                updateFormData({
                  country: selectedCountry.value,
                  countryCode: selectedCountry.countryCode || '',
                  state: '',
                  stateLatitude: undefined,
                  stateLongitude: undefined,
                })
              }
            />
          </FormInputGroup>

          <FormInputGroup label={t('aiTour.state')} required>
            <FormLocationSelect
              value={formData.state}
              disabled={!formData.country}
              placeholder={
                formData.country
                  ? t('creation.details.statePlaceholder')
                  : t('creation.details.stateDisabledPlaceholder', {
                      defaultValue: 'Select a country first',
                    })
              }
              types="(states)"
              countryCode={formData.countryCode}
              countryName={formData.country}
              onSelect={(selectedState) =>
                updateFormData({
                  state: selectedState.value,
                  stateLatitude: selectedState.latitude,
                  stateLongitude: selectedState.longitude,
                })
              }
            />
          </FormInputGroup>

          <FormInputGroup label={t('aiTour.theme')} required>
            <FormTextInput
              value={formData.theme}
              onChangeText={(text) => updateFormData({ theme: text })}
              placeholder={t('aiTour.themePlaceholder')}
              maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
            />
            <ThemeSuggestions
              onSelect={(selectedTheme) => updateFormData({ theme: selectedTheme })}
            />
          </FormInputGroup>

          <View style={styles.sectionDivider} />

          <View>
            <Text style={styles.sectionTitle}>{t('aiTour.mode')}</Text>
            <Text style={styles.sectionSubtitle}>{t('aiTour.modeSubtitle')}</Text>
            <FormOptionCard
              options={tourModeOptions}
              selectedValue={formData.mode}
              onSelect={(value) => updateFormData({ mode: value as AITourFormData['mode'] })}
            />
          </View>

          <View style={styles.sectionDivider} />

          <FormInputGroup label={t('aiTour.duration')}>
            <FormDurationPicker
              value={formData.duration}
              onChange={(duration) => updateFormData({ duration })}
              min={15}
              max={180}
              step={15}
            />
            <InfoCard message={t('aiTour.durationInfo')} />
          </FormInputGroup>

          <View style={styles.sectionDivider} />

          <LanguageSelector
            selectedLanguage={formData.language}
            onSelect={(language) => updateFormData({ language })}
          />

          <View style={styles.sectionDivider} />

          <FormInputGroup label={t('aiTour.additionalDetails')}>
            <FormTextArea
              value={formData.additionalDetails}
              onChangeText={(text) => updateFormData({ additionalDetails: text })}
              placeholder={t('aiTour.additionalDetailsPlaceholder')}
              numberOfLines={4}
              maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
            />
          </FormInputGroup>
        </ScrollView>

        <GenerateButton onPress={handleGenerate} disabled={!isFormValid} isLoading={isLoading} />
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} />
    </View>
  );
}
