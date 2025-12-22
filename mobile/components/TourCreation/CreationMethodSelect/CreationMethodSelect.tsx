import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { creationMethodStyles } from './CreationMethodSelect.styles';
import Colors from '@/constants/Colors';

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

  return (
    <TouchableOpacity
      style={[styles.optionCard, disabled && styles.disabledCard]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {comingSoon && (
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
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
      <View style={styles.content}>
        <Text style={styles.title}>Create Your Tour</Text>
        <Text style={styles.subtitle}>Choose how you want to create your tour experience</Text>

        <View style={styles.optionsContainer}>
          <OptionCard
            icon="create-outline"
            title="Personal Creation"
            description="Manually select locations, add stories, and customize every detail of your tour"
            onPress={handlePersonalCreate}
          />

          <OptionCard
            icon="sparkles"
            title="AI-Powered Creation"
            description="Let AI help you generate tour content, stories, and suggestions based on your preferences"
            onPress={handleAICreate}
          />
        </View>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipText}>Nevermind, I'll find a tour</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
