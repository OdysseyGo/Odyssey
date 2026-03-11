import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { imageUploadSectionStyles } from './ImageUploadSection.styles';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

type ImageUploadSectionProps = {
  image?: string;
  onImageChange: (image: string | undefined) => void;
};

export default function ImageUploadSection({ image, onImageChange }: ImageUploadSectionProps) {
  const theme = useColorTheme();
  const styles = imageUploadSectionStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  const handlePickImage = async () => {
    // TODO: Install expo-image-picker and implement proper image selection
    Alert.alert(
      t('creation.story.imagePickerTitle'),
      t('creation.story.imagePickerMessage'),
      [{ text: t('creation.story.ok') }]
    );
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
  };

  return (
    <View style={styles.imageSection}>
      <Text style={styles.label}>{t('creation.story.coverImage')}</Text>
      {image ? (
        <View>
          <Image source={{ uri: image }} style={styles.imagePreview} />
          <TouchableOpacity style={styles.removeImageButton} onPress={handleRemoveImage}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePlaceholder} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={48} color={color.subText} />
          <Text style={styles.imagePlaceholderText}>{t('creation.story.tapToAddImage')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
