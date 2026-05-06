import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

type SquareCameraOverlayCaptureProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (croppedImageUri: string) => void | Promise<void>;
  title?: string;
  subtitle?: string;
  captureLabel?: string;
};

const CROP_RATIO = 0.62;
const OUTPUT_SIZE = 512;

async function safeDeleteFile(uri?: string | null) {
  if (!uri || !uri.startsWith('file://')) return;

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // Best-effort cleanup only.
  }
}

export default function SquareCameraOverlayCapture({
  visible,
  onClose,
  onCapture,
  title,
  subtitle,
  captureLabel,
}: SquareCameraOverlayCaptureProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const squareSize = Math.min(width * 0.72, height * 0.52);
  const frameTop = (height - squareSize) / 2;
  const frameLeft = (width - squareSize) / 2;
  const maskBleed = Math.max(width, height);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleTakePhoto = async () => {
    if (isCapturing || !cameraRef.current) return;

    let rawPhotoUri: string | null = null;
    let fixedPhotoUri: string | null = null; 

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });
      rawPhotoUri = photo?.uri ?? null;

      if (!photo?.uri || !photo.width || !photo.height || !isMounted.current) {
        return;
      }
      const fixedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [], 
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      fixedPhotoUri = fixedImage.uri;
      if (!isMounted.current) return;

      const cropEdge = Math.floor(Math.min(fixedImage.width, fixedImage.height) * CROP_RATIO);
      const originX = Math.max(0, Math.floor((fixedImage.width - cropEdge) / 2));
      const originY = Math.max(0, Math.floor((fixedImage.height - cropEdge) / 2));


      const manipulated = await ImageManipulator.manipulateAsync(
        fixedImage.uri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropEdge,
              height: cropEdge,
            },
          },
          {
            resize: { width: OUTPUT_SIZE, height: OUTPUT_SIZE },
          },
        ],
        {
          compress: 0.85,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      if (!isMounted.current) {
        // If user closed the camera while processing, delete the final result too!
        await safeDeleteFile(manipulated.uri);
        return;
      }

      await onCapture(manipulated.uri);
      onClose();
      
      if (manipulated.uri !== rawPhotoUri) {
        await safeDeleteFile(rawPhotoUri);
      }
      if (fixedPhotoUri && manipulated.uri !== fixedPhotoUri) {
        await safeDeleteFile(fixedPhotoUri);
      }
    } catch {
      Alert.alert(t('camera.captureFailedTitle'), t('camera.captureFailedMessage'));
      await safeDeleteFile(rawPhotoUri);
      await safeDeleteFile(fixedPhotoUri);
    } finally {
      await safeDeleteFile(rawPhotoUri);
      await safeDeleteFile(fixedPhotoUri);
      setIsCapturing(false);
    }
  };

  const hasPermission = !!permission?.granted;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.root}>
        {hasPermission ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={styles.permissionContainer}>
            <MaterialCommunityIcons name="camera-off" size={52} color={color.white} />
            <Text style={styles.permissionTitle}>{t('camera.permissionTitle')}</Text>
            <Text style={styles.permissionText}>{t('camera.permissionMessage')}</Text>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>{t('camera.grantPermission')}</Text>
            </Pressable>
          </View>
        )}

        <View
          style={[
            styles.spotlightMask,
            {
              width: squareSize + maskBleed * 2,
              height: squareSize + maskBleed * 2,
              top: frameTop - maskBleed,
              left: frameLeft - maskBleed,
              borderWidth: maskBleed,
              borderRadius: maskBleed + Spacing.borderRadius,
            },
          ]}
        />
        <View
          style={[
            styles.squareFrame,
            {
              width: squareSize,
              height: squareSize,
              top: frameTop,
              left: frameLeft,
            },
          ]}
        />

        <View style={[styles.topBar, { top: insets.top + Spacing.lg }]}>
          <Pressable style={styles.iconButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={26} color={color.white} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title ?? t('camera.defaultTitle')}</Text>
            <Text style={styles.subtitle}>{subtitle ?? t('camera.defaultSubtitle')}</Text>
          </View>
          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.bottomBar}>
          <Pressable
            style={[
              styles.captureButton,
              (!hasPermission || isCapturing) && styles.captureDisabled,
            ]}
            disabled={!hasPermission || isCapturing}
            onPress={handleTakePhoto}
          >
            {isCapturing ? (
              <ActivityIndicator color={color.white} />
            ) : (
              <Text style={styles.captureText}>{captureLabel ?? t('camera.capture')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(theme: 'light' | 'dark') {
  const color = Colors[theme];

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: '#000',
    },
    squareFrame: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: color.white,
      borderRadius: Spacing.borderRadius,
    },
    spotlightMask: {
      position: 'absolute',
      borderColor: 'rgba(0, 0, 0, 0.56)',
    },
    topBar: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.35)',
    },
    iconPlaceholder: {
      width: 40,
      height: 40,
    },
    titleWrap: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    title: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
    },
    subtitle: {
      color: color.white,
      opacity: 0.85,
      fontSize: 12,
      marginTop: 2,
    },
    bottomBar: {
      position: 'absolute',
      left: Spacing.md,
      right: Spacing.md,
      bottom: Spacing.xl,
      alignItems: 'center',
    },
    captureButton: {
      minWidth: 180,
      backgroundColor: color.primary,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    captureDisabled: {
      opacity: 0.65,
    },
    captureText: {
      color: color.white,
      fontSize: 15,
      fontWeight: '700',
    },
    permissionContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xxl,
      gap: Spacing.md,
    },
    permissionTitle: {
      color: color.white,
      fontWeight: '700',
      fontSize: 18,
    },
    permissionText: {
      color: color.white,
      textAlign: 'center',
      opacity: 0.85,
      lineHeight: 20,
    },
    permissionButton: {
      marginTop: Spacing.sm,
      backgroundColor: color.primary,
      borderRadius: Spacing.borderRadius,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
    },
    permissionButtonText: {
      color: color.white,
      fontWeight: '700',
    },
  });
}
