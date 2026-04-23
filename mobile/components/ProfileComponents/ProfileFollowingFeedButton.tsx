import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileFollowingFeedButtonStyles } from './ProfileFollowingFeedButton.styles';

export default function ProfileFollowingFeedButton() {
  const [isPressedFeedback, setIsPressedFeedback] = useState(false);
  const theme = useColorTheme();
  const styles = profileFollowingFeedButtonStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  const handlePress = async () => {
    setIsPressedFeedback(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsPressedFeedback(false);
    router.navigate('/profile/following-feed');
  };

  return (
    <TouchableOpacity
      style={[styles.button, isPressedFeedback && styles.buttonPressed]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="newspaper-outline" size={16} color={color.primary} />
      <Text style={styles.buttonText}>{t('profile.followingFeedTitle')}</Text>
    </TouchableOpacity>
  );
}
