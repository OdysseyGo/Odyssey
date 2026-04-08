import React from 'react';
import { Pressable, StyleSheet, StyleProp, ViewStyle, Touchable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Button } from '@react-navigation/elements';

type BackButtonProps = {
  onPress?: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
  size?: number;
};

export default function BackButton({ onPress, color, style, size = 24 }: BackButtonProps) {
  const theme = useColorTheme();
  const iconColor = color ?? Colors[theme].text;

  const handlePress = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/tourDisplay');
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={[styles.container, style]}
    >
      <Ionicons name="arrow-back" size={size} color={iconColor} />
    </TouchableOpacity>
   );
}

const BUTTON_SIZE = 38;

const styles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
