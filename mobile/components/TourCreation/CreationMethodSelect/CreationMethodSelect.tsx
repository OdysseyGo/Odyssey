import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationMethodStyles } from './CreationMethodSelect.styles';
import { CreationHeader } from '@/components/TourCreation/common';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import { getCurrentUser } from '@/api/auth';

type OptionCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  disabled?: boolean;
  muted?: boolean;
  comingSoon?: boolean;
  locked?: boolean;
  lockedLabel?: string;
};

function OptionCard({
  icon,
  title,
  description,
  onPress,
  disabled,
  muted,
  comingSoon,
  locked,
  lockedLabel,
}: OptionCardProps) {
  const theme = useColorTheme();
  const styles = creationMethodStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.optionCard, muted && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {locked && lockedLabel ? (
        <View style={styles.lockedBadge}>
          <Ionicons name="lock-closed" size={12} color={color.white} />
          <Text style={styles.lockedBadgeText}>{lockedLabel}</Text>
        </View>
      ) : null}
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
  const { t } = useTranslation();
  const [currentUserLevel, setCurrentUserLevel] = useState<number | null>(null);
  const [personalTourMinLevel, setPersonalTourMinLevel] = useState<number>(5);

  useEffect(() => {
    let isActive = true;
    getCurrentUser()
      .then((user) => {
        if (isActive) {
          setCurrentUserLevel(user?.level ?? 1);
          setPersonalTourMinLevel(user?.personal_tour_min_level ?? 5);
        }
      })
      .catch(() => {
        if (isActive) {
          setCurrentUserLevel(1);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const isPersonalCreationLocked = useMemo(() => {
    if (currentUserLevel === null) return true;
    return currentUserLevel < personalTourMinLevel;
  }, [currentUserLevel, personalTourMinLevel]);

  const handlePersonalCreate = async () => {
    let resolvedLevel = currentUserLevel;
    if (resolvedLevel === null) {
      const user = await getCurrentUser();
      resolvedLevel = user?.level ?? 1;
      setCurrentUserLevel(resolvedLevel);
      setPersonalTourMinLevel(user?.personal_tour_min_level ?? 5);
    }

    if (resolvedLevel < personalTourMinLevel) {
      Alert.alert(
        t('creation.method.personalLockedTitle', { level: personalTourMinLevel }),
        t('creation.method.personalLockedMessage', {
          level: personalTourMinLevel,
          currentLevel: resolvedLevel,
        }),
      );
      return;
    }

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
            muted={isPersonalCreationLocked}
            locked={isPersonalCreationLocked}
            lockedLabel={t('creation.method.personalUnlockLevel', {
              level: personalTourMinLevel,
            })}
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
