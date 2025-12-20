import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsModalHeaderStyles } from './AddFriendsModalHeader.styles';
import { AddFriendsModalHeaderProps } from './AddFriendsModalHeader.config';

export default function AddFriendsModalHeader({}: AddFriendsModalHeaderProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalHeaderStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesome name="users" size={24} color={color.text} />
      </View>
      <Text style={styles.title}>Discover Friends</Text>
      <Text style={styles.subtitle}>Search and connect with new friends</Text>
    </View>
  );
}
