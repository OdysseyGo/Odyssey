import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationMethodStyles } from './CreationMethodSelect.styles';
import { CreationHeader } from '@/components/TourCreation/common';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

type OptionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
};

function OptionCard({ icon, title, description, onPress, disabled, comingSoon }: OptionCardProps) {
  const theme = useColorTheme();
  const styles = creationMethodStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.optionCard, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>{t('creation.method.comingSoon')}</Text>
        </View>
      )}
      <View style={styles.optionIconContainer}>
        <Ionicons name={icon} size={40} color={color.primary} />
      </View>
      <Text style={styles.optionTitle}>{title}</Text>
      <Text style={styles.optionDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

export default function CreationMethodSelect() {
  const theme = useColorTheme();
  const styles = creationMethodStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  const handlePersonalCreate = () => {
    router.push('/tour-details');
  };

  const handleAICreate = () => {
    router.push('/ai-tour-creation');
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <CreationHeader title={t('creation.method.title')} />
      <View style={styles.content}>
        <Text style={styles.title}>{t('creation.method.title')}</Text>
        <Text style={styles.subtitle}>{t('creation.method.subtitle')}</Text>

        <View style={styles.optionsContainer}>
          <OptionCard
            icon="create-outline"
            title={t('creation.method.personal')}
            description={t('creation.method.personalDescription')}
            onPress={handlePersonalCreate}
          />

          <OptionCard
            icon="sparkles"
            title={t('creation.method.ai')}
            description={t('creation.method.aiDescription')}
            onPress={handleAICreate}
          />
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipText}>{t('creation.method.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
