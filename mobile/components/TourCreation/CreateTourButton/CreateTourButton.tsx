import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorTheme } from '@/utils/useColorTheme';
import { createTourButtonStyles } from './CreateTourButton.styles';
import Colors from '@/constants/Colors';
import { useActiveTour } from '@/contexts/ActiveTourContext';

export default function CreateTourButton() {
  const theme = useColorTheme();
  const styles = createTourButtonStyles(theme);
  const color = Colors[theme];
  const { isActive, tour } = useActiveTour();

  const activeTourVisible = isActive && !!tour;

  const handlePress = () => {
    router.push('/create-tour');
  };

  return (
    <View
      style={{
        position: 'absolute',
        bottom: activeTourVisible ? 96 : 24,
        right: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <TouchableOpacity style={styles.floatingButton} onPress={handlePress} activeOpacity={0.8}>
        <Ionicons name="add" size={30} color={color.white} />
      </TouchableOpacity>
    </View>
  );
}
