import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { getViroModule, isViroAvailable } from '@/utils/viro';

const MODEL_POSITION: [number, number, number] = [0, 0, -1.2];
const MODEL_SCALE: [number, number, number] = [0.25, 0.25, 0.25];
const DEFAULT_MODEL_SCALE_METERS = 1;
const MIN_MODEL_SCALE_METERS = 0.3;
const MAX_MODEL_SCALE_METERS = 10;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getScaledModelScale(modelScaleMeters: number): [number, number, number] {
  return [
    MODEL_SCALE[0] * modelScaleMeters,
    MODEL_SCALE[1] * modelScaleMeters,
    MODEL_SCALE[2] * modelScaleMeters,
  ];
}

function toModelWorldPoint(
  point: [number, number, number],
  modelPosition: [number, number, number] = MODEL_POSITION,
  modelScale: [number, number, number] = MODEL_SCALE
): [number, number, number] {
  return [
    modelPosition[0] + point[0] * modelScale[0],
    modelPosition[1] + point[1] * modelScale[1],
    modelPosition[2] + point[2] * modelScale[2],
  ];
}

function ARPuzzleScene(props: any) {
  const viro = getViroModule();
  if (!viro) {
    return null;
  }

  const { Viro3DObject, ViroARScene, ViroAmbientLight, ViroText } = viro;
  const appProps = props.sceneNavigator.viroAppProps;
  const sceneAssetUrl = appProps?.sceneAssetUrl as string;
  const secretCode = appProps?.secretCode as string;
  const defaultSecretCode = appProps?.defaultSecretCode as string;
  const anchorPosition = (appProps?.anchorPosition as [number, number, number]) ?? [0, 0.3, -1.2];
  const modelScaleMeters = clamp(
    Number(appProps?.modelScaleMeters ?? DEFAULT_MODEL_SCALE_METERS),
    MIN_MODEL_SCALE_METERS,
    MAX_MODEL_SCALE_METERS
  );
  const modelScale = getScaledModelScale(modelScaleMeters);
  const anchorWorldPosition = toModelWorldPoint(anchorPosition, MODEL_POSITION, modelScale);

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={600} />
      <Viro3DObject
        source={{ uri: sceneAssetUrl }}
        position={MODEL_POSITION}
        scale={modelScale}
        type="GLB"
      />
      <ViroText
        text={secretCode || defaultSecretCode}
        width={1}
        height={1}
        style={styles.viroText}
        position={anchorWorldPosition}
        scale={[0.12, 0.12, 0.12]}
      />
      <ViroText
        text={secretCode || defaultSecretCode}
        width={1}
        height={1}
        style={styles.viroText}
        position={anchorWorldPosition}
        rotation={[0, 180, 0]}
        scale={[0.12, 0.12, 0.12]}
      />
    </ViroARScene>
  );
}

export default function ARPuzzleViewScreen() {
  const insets = useSafeAreaInsets();
  const viro = getViroModule();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    sceneAssetUrl?: string;
    secretCode?: string;
    anchorX?: string;
    anchorY?: string;
    anchorZ?: string;
    modelScaleMeters?: string;
  }>();

  const sceneAssetUrl = params.sceneAssetUrl ?? '';
  const secretCode = params.secretCode ?? '';
  const anchorPosition: [number, number, number] = [
    Number(params.anchorX ?? 0),
    Number(params.anchorY ?? 0.3),
    Number(params.anchorZ ?? -1.2),
  ];
  const modelScaleMeters = clamp(
    Number(params.modelScaleMeters ?? DEFAULT_MODEL_SCALE_METERS),
    MIN_MODEL_SCALE_METERS,
    MAX_MODEL_SCALE_METERS
  );

  if (!viro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{t('arPuzzleView.viroUnavailable')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>{t('tourStep.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { ViroARSceneNavigator } = viro;

  if (!sceneAssetUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{t('arPuzzleView.missingAsset')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>{t('tourStep.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isViroAvailable()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{t('arPuzzleView.viewUnavailable')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>{t('tourStep.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('arPuzzleView.title')}</Text>
        <View style={styles.topBarSpacer} />
      </View>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: ARPuzzleScene as any }}
        viroAppProps={{
          sceneAssetUrl,
          secretCode,
          anchorPosition,
          modelScaleMeters,
          defaultSecretCode: t('arPuzzleView.defaultCode'),
        }}
        style={styles.navigator}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  navigator: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  topBarSpacer: {
    width: 36,
    height: 36,
  },
  viroText: {
    fontFamily: 'Arial',
    fontSize: 22,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#2563eb',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
