import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

export default function SquareCameraOverlayCapture({
  visible,
  onClose,
  onCapture,
  title = 'Align target in the square',
  subtitle = 'Only the center square region will be used.',
  captureLabel = 'Capture',
}: SquareCameraOverlayCaptureProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = useMemo(() => getStyles(theme), [theme]);
  const { width, height } = useWindowDimensions();

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

  const handleTakePhoto = async () => {
    if (isCapturing || !cameraRef.current) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      if (!photo?.uri || !photo.width || !photo.height) {
        return;
      }

      const cropEdge = Math.floor(Math.min(photo.width, photo.height) * CROP_RATIO);
      const originX = Math.max(0, Math.floor((photo.width - cropEdge) / 2));
      const originY = Math.max(0, Math.floor((photo.height - cropEdge) / 2));

      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
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

      await onCapture(manipulated.uri);
      onClose();
    } finally {
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
            <Text style={styles.permissionTitle}>Camera permission needed</Text>
            <Text style={styles.permissionText}>
              Allow camera access to capture inside the guided square.
            </Text>
            <Pressable style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.mask, { top: 0, left: 0, right: 0, height: frameTop }]} />
        <View
          style={[
            styles.mask,
            { top: frameTop, left: 0, width: frameLeft, height: squareSize },
          ]}
        />
        <View
          style={[
            styles.mask,
            {
              top: frameTop,
              left: frameLeft + squareSize,
              right: 0,
              height: squareSize,
            },
          ]}
        />
        <View
          style={[
            styles.mask,
            {
              top: frameTop + squareSize,
              left: 0,
              right: 0,
              bottom: 0,
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

        <View style={styles.topBar}>
          <Pressable style={styles.iconButton} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={26} color={color.white} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.iconPlaceholder} />
        </View>

        <View style={styles.bottomBar}>
          <Pressable
            style={[styles.captureButton, (!hasPermission || isCapturing) && styles.captureDisabled]}
            disabled={!hasPermission || isCapturing}
            onPress={handleTakePhoto}
          >
            {isCapturing ? (
              <ActivityIndicator color={color.white} />
            ) : (
              <Text style={styles.captureText}>{captureLabel}</Text>
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
    mask: {
      position: 'absolute',
      backgroundColor: 'rgba(0, 0, 0, 0.56)',
    },
    squareFrame: {
      position: 'absolute',
      borderWidth: 2,
      borderColor: color.white,
      borderRadius: Spacing.borderRadius,
    },
    topBar: {
      position: 'absolute',
      top: Spacing.xl,
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
