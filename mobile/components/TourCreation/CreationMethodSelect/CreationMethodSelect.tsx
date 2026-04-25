import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  accent: 'primary' | 'secondary';
  meta: string;
  onPress: () => void;
  disabled?: boolean;
  comingSoon?: boolean;
};

function OptionCard({
  icon,
  title,
  description,
  accent,
  meta,
  onPress,
  disabled,
  comingSoon,
}: OptionCardProps) {
  const theme = useColorTheme();
  const styles = creationMethodStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();
  const accentColor = accent === 'primary' ? color.primary : color.secondary;

  return (
    <TouchableOpacity
      style={[styles.optionCard, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <View style={[styles.optionAccent, { backgroundColor: accentColor }]} />
      {comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>{t('creation.method.comingSoon')}</Text>
        </View>
      )}
      <View style={styles.optionHeader}>
        <View style={[styles.optionIconContainer, { backgroundColor: `${accentColor}18` }]}>
          <Ionicons name={icon} size={28} color={accentColor} />
        </View>
        <View style={styles.optionHeaderText}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={[styles.optionMeta, { color: accentColor }]}>{meta}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={color.subText} />
      </View>
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
        <LinearGradient
          colors={[color.headerGradientTop, color.headerGradientBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="map" size={28} color={color.white} />
          </View>
          <Text style={styles.title}>{t('creation.method.title')}</Text>
          <Text style={styles.subtitle}>{t('creation.method.subtitle')}</Text>
        </LinearGradient>

        <View style={styles.optionsContainer}>
          <OptionCard
            icon="create-outline"
            title={t('creation.method.personal')}
            description={t('creation.method.personalDescription')}
            accent="primary"
            meta={t('creation.method.guided', { defaultValue: 'Guided builder' })}
            onPress={handlePersonalCreate}
          />

          <OptionCard
            icon="sparkles"
            title={t('creation.method.ai')}
            description={t('creation.method.aiDescription')}
            accent="secondary"
            meta={t('creation.method.fastDraft', { defaultValue: 'Fast draft' })}
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
