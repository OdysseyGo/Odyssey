import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { createTourButtonStyles } from './CreateTourButton.styles';
import Colors from '@/constants/Colors';

export default function CreateTourButton() {
  const theme = useColorTheme();
  const styles = createTourButtonStyles(theme);
  const color = Colors[theme];

  const handlePress = () => {
    router.push('/create-tour');
  };

  return (
    <TouchableOpacity style={styles.floatingButton} onPress={handlePress} activeOpacity={0.8}>
      <Ionicons name="add" size={32} color={color.white} />
    </TouchableOpacity>
  );
}
