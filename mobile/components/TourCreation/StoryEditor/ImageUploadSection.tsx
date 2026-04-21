import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, Pressable, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColorTheme } from '@/utils/useColorTheme';
import { imageUploadSectionStyles } from './ImageUploadSection.styles';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import SquareCameraOverlayCapture from '@/components/common/SquareCameraOverlayCapture';

type ImageUploadSectionProps = {
  image?: string;
  onImageChange: (image: string | undefined) => void;
  label?: string;
  required?: boolean;
  useReferenceImageUI?: boolean;
  infoMessage?: string;
};

const DEFAULT_INFO_MESSAGE = [
  'Pick something that is not temporary.',
  'Appropriate.',
  "Has good lighting and doesn't depend much on the time of day.",
].join('\n');

export default function ImageUploadSection({
  image,
  onImageChange,
  label,
  required = false,
  useReferenceImageUI = false,
  infoMessage,
}: ImageUploadSectionProps) {
  const theme = useColorTheme();
  const styles = imageUploadSectionStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [fullscreenImageUri, setFullscreenImageUri] = useState<string | null>(null);

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo library access to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      onImageChange(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    Alert.alert(t('creation.story.imagePickerTitle'), 'Choose image source', [
      { text: 'Camera', onPress: () => setIsCameraVisible(true) },
      { text: 'Photo Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemoveImage = () => {
    onImageChange(undefined);
  };

  const displayLabel = `${label ?? t('creation.story.coverImage')}${required ? ' *' : ''}`;
  const canShowInfo = useReferenceImageUI;

  return (
    <View style={styles.imageSection}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{displayLabel}</Text>
        {canShowInfo && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Reference image requirements', infoMessage ?? DEFAULT_INFO_MESSAGE)
            }
            accessibilityRole="button"
            accessibilityLabel="Show reference image requirements"
            style={styles.infoButton}
          >
            <Ionicons name="information-circle-outline" size={16} color={color.subText} />
          </TouchableOpacity>
        )}
      </View>
      {image ? (
        <View>
          {useReferenceImageUI ? (
            <Pressable
              style={styles.referenceImageButton}
              onPress={() => setFullscreenImageUri(image)}
              accessibilityRole="button"
              accessibilityLabel="Open target image full screen"
            >
              <Image source={{ uri: image }} style={styles.referenceImagePreview} resizeMode="cover" />
              <View style={styles.referenceImageOverlay}>
                <Text style={styles.referenceImageOverlayText}>Tap to view full image</Text>
              </View>
            </Pressable>
          ) : (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          )}
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

      <SquareCameraOverlayCapture
        visible={isCameraVisible}
        onClose={() => setIsCameraVisible(false)}
        onCapture={(uri) => onImageChange(uri)}
        title="Place target in square"
        subtitle="Only the highlighted square area is saved."
        captureLabel="Capture Reference"
      />

      <Modal
        visible={!!fullscreenImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenImageUri(null)}
      >
        <Pressable style={styles.referenceImageModalOverlay} onPress={() => setFullscreenImageUri(null)}>
          <Pressable style={styles.referenceImageModalContent} onPress={() => {}}>
            <Image
              source={{ uri: fullscreenImageUri ?? '' }}
              style={styles.referenceImageFull}
              resizeMode="contain"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
