import React, { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import { profileAddFriendsButtonStyles } from './ProfileAddFriendsButton.styles';
import { ProfileAddFriendsButtonProps } from './ProfileAddFriendsButton.config';

export default function ProfileAddFriendsButton({ onPress }: ProfileAddFriendsButtonProps) {
  const [isPressedFeedback, setIsPressedFeedback] = useState(false);
  const theme = useColorTheme();
  const styles = profileAddFriendsButtonStyles(theme);

  const handlePress = async () => {
    setIsPressedFeedback(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    setIsPressedFeedback(false);
  };

  return (
    <TouchableOpacity
      style={[styles.button, isPressedFeedback && styles.buttonPressed]}
      onPress={handlePress}
      activeOpacity={1}
    >
      <FontAwesome name="plus" size={18} color="white" />
      <Text style={styles.buttonText}>Add Friend</Text>
    </TouchableOpacity>
  );
}

