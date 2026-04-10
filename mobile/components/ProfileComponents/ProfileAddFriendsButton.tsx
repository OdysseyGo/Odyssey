import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileAddFriendsButtonStyles } from './ProfileAddFriendsButton.styles';
import { ProfileAddFriendsButtonProps } from './ProfileAddFriendsButton.config';
import { useTranslation } from 'react-i18next';

export default function ProfileAddFriendsButton({ onPress }: ProfileAddFriendsButtonProps) {
  const [isPressedFeedback, setIsPressedFeedback] = useState(false);
  const theme = useColorTheme();
  const styles = profileAddFriendsButtonStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  const handlePress = async () => {
    setIsPressedFeedback(true);
    await new Promise((resolve) => setTimeout(resolve, 200));
    setIsPressedFeedback(false);
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[styles.button, isPressedFeedback && styles.buttonPressed]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Ionicons name="person-add-outline" size={16} color={color.primary} />
      <Text style={styles.buttonText}>{t('friends.addFriend')}</Text>
    </TouchableOpacity>
  );
}
