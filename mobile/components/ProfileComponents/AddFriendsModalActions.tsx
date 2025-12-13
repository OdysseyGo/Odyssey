import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { addFriendsModalActionsStyles } from './AddFriendsModalActions.styles';
import { AddFriendsModalActionsProps } from './AddFriendsModalActions.config';

export default function AddFriendsModalActions({ onCancel }: AddFriendsModalActionsProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalActionsStyles(theme);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
