import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
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
  createEmptyFormData,
} from '@/components/AITourCreation';
import { generateAITour } from '@/api/aiTours';
import { getAIGenerationAllowance } from '@/api/payments';
import { useTranslation } from 'react-i18next';

export default function AITourCreation() {
  const theme = useColorTheme();
  const styles = aiTourCreationStyles(theme);
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AITourFormData>(createEmptyFormData());
  const [aiAllowance, setAiAllowance] = useState<{
    used: number;
    limit: number;
    unlimited: boolean;
  } | null>(null);

  useEffect(() => {
    getAIGenerationAllowance()
      .then(setAiAllowance)
      .catch(() => null);
  }, []);

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

  const isFormValid = formData.city.trim() !== '' && formData.theme.trim() !== '';

  const handleGenerate = async () => {
    if (!isFormValid) {
      Alert.alert(t('aiTour.missingInfoTitle'), t('aiTour.missingInfoMessage'));
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

          {/* AI generation quota banner */}
          {aiAllowance && !aiAllowance.unlimited && (
            <View
              style={{
                marginHorizontal: 0,
                marginBottom: 12,
                padding: 12,
                borderRadius: 10,
                backgroundColor:
                  aiAllowance.used >= aiAllowance.limit ? '#FEE2E2' : '#FFF7ED',
                borderWidth: 1,
                borderColor:
                  aiAllowance.used >= aiAllowance.limit ? '#FCA5A5' : '#FED7AA',
              }}
            >
              {aiAllowance.used >= aiAllowance.limit ? (
                <>
                  <Text style={{ fontWeight: '700', color: '#DC2626', marginBottom: 4 }}>
                    Monthly limit reached
                  </Text>
                  <Text style={{ color: '#DC2626', fontSize: 13 }}>
                    You have used all {aiAllowance.limit} free AI generations this month.
                  </Text>
                  <Pressable onPress={() => router.push('/subscription')}>
                    <Text
                      style={{ color: '#7C3AED', fontWeight: '700', marginTop: 6, fontSize: 13 }}
                    >
                      Upgrade to Premium for unlimited →
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Text style={{ color: '#92400E', fontSize: 13 }}>
                  {aiAllowance.limit - aiAllowance.used} of {aiAllowance.limit} free AI generations
                  remaining this month
                </Text>
              )}
            </View>
          )}

          {/* City Input */}
          <FormInputGroup label={t('aiTour.city')} required>
            <FormTextInput
              value={formData.city}
              onChangeText={(text) => updateFormData({ city: text })}
              placeholder={t('aiTour.cityPlaceholder')}
              autoCapitalize="words"
            />
          </FormInputGroup>

          {/* Theme Input */}
          <FormInputGroup label={t('aiTour.theme')} required>
            <FormTextInput
              value={formData.theme}
              onChangeText={(text) => updateFormData({ theme: text })}
              placeholder={t('aiTour.themePlaceholder')}
            />
            <ThemeSuggestions
              onSelect={(selectedTheme) => updateFormData({ theme: selectedTheme })}
            />
          </FormInputGroup>

          <View style={styles.sectionDivider} />

          {/* Tour Mode */}
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

          {/* Duration */}
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

          {/* Language Selection */}
          <LanguageSelector
            selectedLanguage={formData.language}
            onSelect={(language) => updateFormData({ language })}
          />

          <View style={styles.sectionDivider} />

          {/* Additional Details */}
          <FormInputGroup label={t('aiTour.additionalDetails')}>
            <FormTextArea
              value={formData.additionalDetails}
              onChangeText={(text) => updateFormData({ additionalDetails: text })}
              placeholder={t('aiTour.additionalDetailsPlaceholder')}
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
