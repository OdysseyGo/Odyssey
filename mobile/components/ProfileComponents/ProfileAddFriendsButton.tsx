import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import { profileAddFriendsButtonStyles } from './ProfileAddFriendsButton.styles';
import { ProfileAddFriendsButtonProps } from './ProfileAddFriendsButton.config';
import Colors from '@/constants/Colors';

export default function ProfileAddFriendsButton({
  onPress,
  isFriend = false,
  isLoading = false,
}: ProfileAddFriendsButtonProps) {
  const theme = useColorTheme();
  const styles = profileAddFriendsButtonStyles(theme);
  const color = Colors[theme];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isFriend ? styles.buttonActive : styles.buttonInactive,
        isLoading && styles.loadingContainer,
      ]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={isFriend ? 'white' : color.primary} size="small" />
      ) : (
        <>
          <FontAwesome
            name={isFriend ? 'check' : 'plus'}
            size={18}
            color={isFriend ? 'white' : color.primary}
          />
          <Text style={[styles.buttonText, isFriend ? styles.buttonActiveText : styles.buttonInactiveText]}>
            {isFriend ? 'Friends' : 'Add Friend'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
