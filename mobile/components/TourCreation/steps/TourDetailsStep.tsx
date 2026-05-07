import React, { useMemo } from 'react';
import { Text, ScrollView } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourDetailsStepStyles } from './TourDetailsStep.styles';
import {
  TourCreationData,
  TOUR_CATEGORIES,
  TOUR_DESCRIPTION_MAX_LENGTH,
  TOUR_TEXT_FIELD_MAX_LENGTH,
} from '../TourCreation.types';
import {
  FormInputGroup,
  FormTextArea,
  FormTextInput,
  FormChipSelect,
  FormOptionCard,
  FormDurationPicker,
  FormLocationSelect,
} from '../inputs';
import ImageUploadSection from '../StoryEditor/ImageUploadSection';
import { useTranslation } from 'react-i18next';

type TourDetailsStepProps = {
  tourData: TourCreationData;
  onUpdate: (updates: Partial<TourCreationData>) => void;
};

export default function TourDetailsStep({ tourData, onUpdate }: TourDetailsStepProps) {
  const theme = useColorTheme();
  const styles = tourDetailsStepStyles(theme);
  const { t } = useTranslation();

  const difficultyOptions = useMemo(
    () => [
      {
        value: 'EASY',
        label: t('creation.difficulty.easy'),
        description: t('creation.difficulty.easyDesc'),
      },
      {
        value: 'MEDIUM',
        label: t('creation.difficulty.medium'),
        description: t('creation.difficulty.mediumDesc'),
      },
      {
        value: 'HARD',
        label: t('creation.difficulty.hard'),
        description: t('creation.difficulty.hardDesc'),
      },
    ],
    [t]
  );

  const tourTypeOptions = useMemo(
    () => [
      {
        value: 'STORY',
        label: t('creation.tourType.story'),
        description: t('creation.tourType.storyDesc'),
      },
      {
        value: 'PUZZLE',
        label: t('creation.tourType.puzzle'),
        description: t('creation.tourType.puzzleDesc'),
      },
      {
        value: 'HYBRID',
        label: t('creation.tourType.hybrid'),
        description: t('creation.tourType.hybridDesc'),
      },
    ],
    [t]
  );

  const categoryKeyMap = useMemo(
    () =>
      Object.fromEntries(
        TOUR_CATEGORIES.map((cat) => [t(`creation.categories.${cat.toLowerCase()}`), cat])
      ),
    [t]
  );

  const translatedCategories = useMemo(
    () => TOUR_CATEGORIES.map((cat) => t(`creation.categories.${cat.toLowerCase()}`)),
    [t]
  ) as unknown as readonly string[];

  const selectedTranslatedCategory = t(`creation.categories.${tourData.category.toLowerCase()}`);

  return (
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>{t('creation.details.title')}</Text>
      <Text style={styles.sectionSubtitle}>{t('creation.details.subtitle')}</Text>

      <FormInputGroup label={t('creation.details.tourTitle')} required>
        <FormTextInput
          value={tourData.title}
          onChangeText={(text) => onUpdate({ title: text })}
          placeholder={t('creation.details.tourTitlePlaceholder')}
          maxLength={TOUR_TEXT_FIELD_MAX_LENGTH}
        />
      </FormInputGroup>

      <FormInputGroup label={t('creation.details.description')} required>
        <FormTextArea
          value={tourData.description}
          onChangeText={(text) => onUpdate({ description: text })}
          placeholder={t('creation.details.descriptionPlaceholder')}
          maxLength={TOUR_DESCRIPTION_MAX_LENGTH}
        />
      </FormInputGroup>

      <ImageUploadSection
        image={tourData.coverImage}
        onImageChange={(coverImage) => onUpdate({ coverImage })}
        label={t('creation.story.coverImage')}
        required
      />

      <FormInputGroup label={t('creation.details.country', { defaultValue: 'Country' })} required>
        <FormLocationSelect
          value={tourData.country}
          placeholder={t('creation.details.countryPlaceholder', {
            defaultValue: 'Search countries...',
          })}
          types="(regions)"
          onClearSelection={() =>
            onUpdate({
              country: '',
              countryCode: '',
              state: '',
              stateLatitude: undefined,
              stateLongitude: undefined,
            })
          }
          onSelect={(selectedCountry) =>
            onUpdate({
              country: selectedCountry.value,
              countryCode: selectedCountry.countryCode || '',
              state: '',
              stateLatitude: undefined,
              stateLongitude: undefined,
            })
          }
        />
      </FormInputGroup>

      <FormInputGroup label={t('creation.details.state')} required>
        <FormLocationSelect
          value={tourData.state}
          disabled={!tourData.country}
          placeholder={
            tourData.country
              ? t('creation.details.statePlaceholder')
              : t('creation.details.stateDisabledPlaceholder', {
                  defaultValue: 'Select a country first',
                })
          }
          types="(states)"
          countryCode={tourData.countryCode}
          countryName={tourData.country}
          onClearSelection={() =>
            onUpdate({
              state: '',
              stateLatitude: undefined,
              stateLongitude: undefined,
            })
          }
          onSelect={(selectedState) =>
            onUpdate({
              state: selectedState.value,
              stateLatitude: selectedState.latitude,
              stateLongitude: selectedState.longitude,
            })
          }
        />
      </FormInputGroup>

      <FormInputGroup label={t('creation.details.category')} required>
        <FormChipSelect
          options={translatedCategories}
          selectedValue={selectedTranslatedCategory}
          onSelect={(translatedValue) =>
            onUpdate({ category: categoryKeyMap[translatedValue] ?? translatedValue })
          }
        />
      </FormInputGroup>

      <FormInputGroup label={t('creation.details.difficulty')}>
        <FormOptionCard
          options={difficultyOptions}
          selectedValue={tourData.difficulty}
          onSelect={(value) => onUpdate({ difficulty: value as 'EASY' | 'MEDIUM' | 'HARD' })}
        />
      </FormInputGroup>

      <FormInputGroup label={t('creation.details.tourType')}>
        <FormOptionCard
          options={tourTypeOptions}
          selectedValue={tourData.tourType}
          onSelect={(value) => onUpdate({ tourType: value as 'STORY' | 'PUZZLE' | 'HYBRID' })}
        />
      </FormInputGroup>

      <FormInputGroup label={t('creation.details.duration')}>
        <FormDurationPicker
          value={tourData.estimatedDuration}
          onChange={(estimatedDuration) => onUpdate({ estimatedDuration })}
        />
      </FormInputGroup>
    </ScrollView>
  );
}
