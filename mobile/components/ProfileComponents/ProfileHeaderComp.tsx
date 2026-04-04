import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { profileHeaderCompStyles } from './ProfileHeaderComp.styles';
import { ProfileHeaderProps } from './ProfileHeaderComp.config';

export default function ProfileHeaderComp({
  title,
  subtitle,
  avatarUrl,
  onAvatarPress,
}: ProfileHeaderProps) {
  const theme = useColorTheme();
  const styles = profileHeaderCompStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.container}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity style={styles.avatarCircle} onPress={onAvatarPress} activeOpacity={0.7}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <FontAwesome name="user" size={56} color={color.text} />
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.title]}>{title}</Text>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
