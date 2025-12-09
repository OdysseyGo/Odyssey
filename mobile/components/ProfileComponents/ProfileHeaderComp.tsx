import React from 'react';
import { View, Text } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';

import { profileHeaderCompStyles } from './ProfileHeaderComp.styles';
import { ProfileHeaderProps } from './ProfileHeaderComp.config';

export default function ProfileHeaderComp({ title, subtitle }: ProfileHeaderProps) {
  const theme = useColorTheme();
  const styles = profileHeaderCompStyles(theme);

  return (
    <View style={styles.container}>


      <View style={styles.avatarWrapper}>
        <View style={styles.avatarCircle}>
          <FontAwesome name="user" size={56} />
        </View>
      </View>

      <Text style={[styles.title]}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
