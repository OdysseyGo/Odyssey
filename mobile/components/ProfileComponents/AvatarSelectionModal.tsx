import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { avatarSelectionModalStyles } from './AvatarSelectionModal.styles';
import {
  AvatarSelectionModalProps,
  DICEBEAR_STYLES,
  DiceBearStyle,
  buildAvatarUrl,
} from './AvatarSelectionModal.config';
import { updateAvatar } from '@/api/users';

export default function AvatarSelectionModal({
  visible,
  onClose,
  currentAvatarUrl,
  onAvatarSaved,
}: AvatarSelectionModalProps) {
  const theme = useColorTheme();
  const styles = avatarSelectionModalStyles(theme);
  const color = Colors[theme];

  const [styleIndex, setStyleIndex] = useState(0);
  const [seed, setSeed] = useState(1);
  const [saving, setSaving] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Parse current avatar URL to restore style/seed when modal opens
  useEffect(() => {
    if (visible && currentAvatarUrl) {
      try {
        const url = new URL(currentAvatarUrl);
        const pathParts = url.pathname.split('/');
        // Path format: /9.x/{style}/png
        const style = pathParts[2] as DiceBearStyle;
        const idx = DICEBEAR_STYLES.indexOf(style);
        if (idx >= 0) setStyleIndex(idx);

        const seedParam = url.searchParams.get('seed');
        if (seedParam) setSeed(parseInt(seedParam, 10) || 1);
      } catch {
        // Ignore parse errors — use defaults
      }
    }
  }, [visible, currentAvatarUrl]);

  const currentStyle = DICEBEAR_STYLES[styleIndex];
  const previewUrl = buildAvatarUrl(currentStyle, seed);

  const nextStyle = useCallback(() => {
    setImageLoading(true);
    setStyleIndex((prev) => (prev + 1) % DICEBEAR_STYLES.length);
  }, []);

  const prevStyle = useCallback(() => {
    setImageLoading(true);
    setStyleIndex((prev) => (prev - 1 + DICEBEAR_STYLES.length) % DICEBEAR_STYLES.length);
  }, []);

  const nextSeed = useCallback(() => {
    setImageLoading(true);
    setSeed((prev) => prev + 1);
  }, []);

  const prevSeed = useCallback(() => {
    setImageLoading(true);
    setSeed((prev) => Math.max(1, prev - 1));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAvatar(previewUrl);
      onAvatarSaved(previewUrl);
      onClose();
    } catch (err) {
      console.error('Failed to save avatar:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <Text style={styles.title}>Choose Your Avatar</Text>

          {/* Avatar Preview */}
          <View style={styles.avatarPreview}>
            <Image
              source={{ uri: previewUrl }}
              style={styles.avatarImage}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}
          </View>

          {/* Seed navigation (changes the specific avatar within a style) */}
          <View style={styles.seedRow}>
            <TouchableOpacity style={styles.arrowButton} onPress={prevSeed}>
              <FontAwesome name="chevron-left" size={18} color={color.white} />
            </TouchableOpacity>
            <Text style={styles.seedText}>#{seed}</Text>
            <TouchableOpacity style={styles.arrowButton} onPress={nextSeed}>
              <FontAwesome name="chevron-right" size={18} color={color.white} />
            </TouchableOpacity>
          </View>

          {/* Style navigation */}
          <Text style={styles.styleLabel}>Style</Text>
          <View style={styles.styleRow}>
            <TouchableOpacity style={styles.smallArrow} onPress={prevStyle}>
              <FontAwesome name="chevron-left" size={14} color={color.white} />
            </TouchableOpacity>
            <View style={styles.styleNameWrapper}>
              <Text style={styles.styleName} numberOfLines={1}>
                {currentStyle}
              </Text>
            </View>
            <TouchableOpacity style={styles.smallArrow} onPress={nextStyle}>
              <FontAwesome name="chevron-right" size={14} color={color.white} />
            </TouchableOpacity>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={color.white} />
              ) : (
                <Text style={styles.saveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
