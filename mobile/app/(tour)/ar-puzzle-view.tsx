import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getViroModule, isViroAvailable, VIRO_UNAVAILABLE_MESSAGE } from '@/utils/viro';

const MODEL_POSITION: [number, number, number] = [0, 0, -1.2];
const MODEL_SCALE: [number, number, number] = [0.25, 0.25, 0.25];
const DEFAULT_MODEL_SCALE_METERS = 1;
const MIN_MODEL_SCALE_METERS = 0.3;
const MAX_MODEL_SCALE_METERS = 10;
const CODE_REVEAL_AFTER_MODEL_MS = 250;
const CODE_REVEAL_FALLBACK_MS = 2500;

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
  const appProps = props.sceneNavigator.viroAppProps;
  const sceneAssetUrl = appProps?.sceneAssetUrl as string;
  const secretCode = appProps?.secretCode as string;
  const anchorPosition = (appProps?.anchorPosition as [number, number, number]) ?? [0, 0.3, -1.2];
  const modelScaleMeters = clamp(
    Number(appProps?.modelScaleMeters ?? DEFAULT_MODEL_SCALE_METERS),
    MIN_MODEL_SCALE_METERS,
    MAX_MODEL_SCALE_METERS
  );
  const modelScale = getScaledModelScale(modelScaleMeters);
  const anchorWorldPosition = toModelWorldPoint(anchorPosition, MODEL_POSITION, modelScale);
  const [showCode, setShowCode] = React.useState(false);
  const fallbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadSignalSeenRef = React.useRef(false);

  const clearTimers = React.useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }, []);

  const scheduleCodeReveal = React.useCallback(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
    }
    revealTimerRef.current = setTimeout(() => {
      setShowCode(true);
    }, CODE_REVEAL_AFTER_MODEL_MS);
  }, []);

  React.useEffect(() => {
    setShowCode(false);
    loadSignalSeenRef.current = false;
    clearTimers();
    // Fallback when certain runtimes do not fire model load callbacks reliably.
    fallbackTimerRef.current = setTimeout(() => {
      if (!loadSignalSeenRef.current) {
        setShowCode(true);
      }
    }, CODE_REVEAL_FALLBACK_MS);

    return clearTimers;
  }, [sceneAssetUrl, clearTimers]);

  const handleModelLoad = React.useCallback(() => {
    loadSignalSeenRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    scheduleCodeReveal();
  }, [scheduleCodeReveal]);

  const handleModelError = React.useCallback(
    (error: unknown) => {
      console.warn('AR model failed to load, revealing code via fallback path.', error);
      loadSignalSeenRef.current = true;
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      // Keep puzzle usable even if model callbacks/error behavior differ by runtime.
      scheduleCodeReveal();
    },
    [scheduleCodeReveal]
  );

  if (!viro) {
    return null;
  }

  const { Viro3DObject, ViroARScene, ViroAmbientLight, ViroText } = viro;

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={600} />
      <Viro3DObject
        source={{ uri: sceneAssetUrl }}
        position={MODEL_POSITION}
        scale={modelScale}
        type="GLB"
        onLoadEnd={handleModelLoad}
        onError={handleModelError}
      />
      {showCode ? (
        <>
          <ViroText
            text={secretCode || 'Code'}
            width={1}
            height={1}
            style={styles.viroText}
            position={anchorWorldPosition}
            scale={[0.12, 0.12, 0.12]}
          />
          <ViroText
            text={secretCode || 'Code'}
            width={1}
            height={1}
            style={styles.viroText}
            position={anchorWorldPosition}
            rotation={[0, 180, 0]}
            scale={[0.12, 0.12, 0.12]}
          />
        </>
      ) : null}
    </ViroARScene>
  );
}

export default function ARPuzzleViewScreen() {
  const insets = useSafeAreaInsets();
  const viro = getViroModule();
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
          <Text style={styles.errorText}>{VIRO_UNAVAILABLE_MESSAGE}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Back</Text>
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
          <Text style={styles.errorText}>Missing AR model asset.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isViroAvailable()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>AR view is unavailable in this runtime.</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeButtonText}>Back</Text>
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
        <Text style={styles.topBarTitle}>View Puzzle</Text>
        <View style={styles.topBarSpacer} />
      </View>
      <ViroARSceneNavigator
        autofocus
        initialScene={{ scene: ARPuzzleScene as any }}
        viroAppProps={{ sceneAssetUrl, secretCode, anchorPosition, modelScaleMeters }}
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
