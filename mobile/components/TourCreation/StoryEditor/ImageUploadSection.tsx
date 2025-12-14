import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import { imageUploadSectionStyles } from './ImageUploadSection.styles';
import Colors from '@/constants/Colors';

type ImageUploadSectionProps = {
  image?: string;
  onImageChange: (image: string | undefined) => void;
};

export default function ImageUploadSection({ image, onImageChange }: ImageUploadSectionProps) {
  const theme = useColorTheme();
  const styles = imageUploadSectionStyles(theme);
  const color = Colors[theme];

  const handlePickImage = async () => {
    // TODO: Install expo-image-picker and implement proper image selection
    Alert.alert(
      'Image Picker',
      'Image picker functionality requires expo-image-picker to be installed.',
      [{ text: 'OK' }]
    );
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
  };

  return (
    <View style={styles.imageSection}>
      <Text style={styles.label}>Cover Image (Optional)</Text>
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
          <Text style={styles.imagePlaceholderText}>Tap to add an image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
