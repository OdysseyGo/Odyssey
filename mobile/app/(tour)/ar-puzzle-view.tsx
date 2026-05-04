import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  findNodeHandle,
  NativeModules,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getViroModule, isViroAvailable, VIRO_UNAVAILABLE_MESSAGE } from '@/utils/viro';
import { useActiveTour } from '@/contexts/ActiveTourContext';

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
  const appProps = props?.sceneNavigator?.viroAppProps ?? {};
  const sceneAssetUrl = appProps?.sceneAssetUrl as string;
  const secretCode = appProps?.secretCode as string;
  const stepId = (appProps?.stepId as string | undefined) ?? 'unknown';
  const puzzleId = (appProps?.puzzleId as string | undefined) ?? 'unknown';
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
    if (__DEV__) {
      console.log('[ARPuzzleScene] model_loaded', {
        stepId,
        puzzleId,
        modelUri: sceneAssetUrl || 'none',
      });
    }
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

  useEffect(() => {
    if (__DEV__) {
      console.log('[ARPuzzleScene] mount', {
        stepId,
        puzzleId,
        modelUri: sceneAssetUrl || 'none',
      });
    }
    return () => {
      if (__DEV__) {
        console.log('[ARPuzzleScene] unmount', {
          stepId,
          puzzleId,
          modelUri: sceneAssetUrl || 'none',
        });
      }
    };
  }, [sceneAssetUrl, stepId, puzzleId]);

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
        onLoadStart={() => {
          if (__DEV__) {
            console.log('[ARPuzzleScene] model_load_started', {
              stepId,
              puzzleId,
              modelUri: sceneAssetUrl || 'none',
            });
          }
        }}
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
  const { isActive } = useActiveTour();
  const instanceIdRef = useRef(`arv-${Math.random().toString(36).slice(2, 8)}`);
  const isDisposedRef = useRef(false);
  const navigatorRef = useRef<any>(null);
  const [navigatorVisible, setNavigatorVisible] = useState(true);
  const params = useLocalSearchParams<{
    sceneAssetUrl?: string;
    secretCode?: string;
    anchorX?: string;
    anchorY?: string;
    anchorZ?: string;
    modelScaleMeters?: string;
    stepId?: string;
    puzzleId?: string;
  }>();

  const sceneAssetUrl = params.sceneAssetUrl ?? '';
  const secretCode = params.secretCode ?? '';
  const stepId = params.stepId ?? 'unknown';
  const puzzleId = params.puzzleId ?? 'unknown';
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

  const cleanupArResources = useCallback(
    (reason: string, hideNavigator: boolean = true) => {
      if (isDisposedRef.current) {
        if (__DEV__) {
          console.log('[ARPuzzleView] cleanup_skip_already_disposed', {
            instanceId: instanceIdRef.current,
            reason,
            stepId,
            puzzleId,
            modelUri: sceneAssetUrl || 'none',
          });
        }
        return;
      }

      isDisposedRef.current = true;
      if (hideNavigator) {
        setNavigatorVisible(false);
      }

      const navigator = navigatorRef.current as any;
      let resetCalled = false;
      let cleanupCalled = false;
      let nodeHandle: number | null = null;

      try {
        if (typeof navigator?._resetARSession === 'function') {
          navigator._resetARSession(true, true);
          resetCalled = true;
        } else if (typeof navigator?.arSceneNavigator?.resetARSession === 'function') {
          navigator.arSceneNavigator.resetARSession(true, true);
          resetCalled = true;
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[ARPuzzleView] reset_error', {
            instanceId: instanceIdRef.current,
            reason,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      try {
        nodeHandle = navigator ? findNodeHandle(navigator) : null;
        if (nodeHandle && NativeModules?.VRTARSceneNavigatorModule?.cleanup) {
          NativeModules.VRTARSceneNavigatorModule.cleanup(nodeHandle);
          cleanupCalled = true;
        }
      } catch (error) {
        if (__DEV__) {
          console.log('[ARPuzzleView] native_cleanup_error', {
            instanceId: instanceIdRef.current,
            reason,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      if (__DEV__) {
        console.log('[ARPuzzleView] cleanup', {
          instanceId: instanceIdRef.current,
          reason,
          stepId,
          puzzleId,
          modelUri: sceneAssetUrl || 'none',
          resetCalled,
          cleanupCalled,
          nodeHandle,
        });
      }
    },
    [puzzleId, sceneAssetUrl, stepId]
  );

  const closeWithCleanup = useCallback(
    (reason: string) => {
      cleanupArResources(reason);
      if (typeof router.canGoBack === 'function' && router.canGoBack()) {
        router.back();
      }
    },
    [cleanupArResources]
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('[ARPuzzleView] mount', {
        instanceId: instanceIdRef.current,
        stepId,
        puzzleId,
        modelUri: sceneAssetUrl || 'none',
      });
    }
    return () => {
      cleanupArResources('unmount', false);
      if (__DEV__) {
        console.log('[ARPuzzleView] unmount', {
          instanceId: instanceIdRef.current,
          stepId,
          puzzleId,
          modelUri: sceneAssetUrl || 'none',
        });
      }
    };
  }, [cleanupArResources, puzzleId, sceneAssetUrl, stepId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        cleanupArResources(`app_state_${nextState}`);
      }
    });
    return () => {
      subscription.remove();
    };
  }, [cleanupArResources]);

  useEffect(() => {
    if (!isActive) {
      if (__DEV__) {
        console.log('[ARPuzzleView] active_tour_cleared_while_visible', {
          instanceId: instanceIdRef.current,
          stepId,
          puzzleId,
        });
      }
      closeWithCleanup('active_tour_cleared');
    }
  }, [closeWithCleanup, isActive, puzzleId, stepId]);

  if (!viro) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>{VIRO_UNAVAILABLE_MESSAGE}</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeWithCleanup('manual_close_viro_unavailable')}
          >
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeWithCleanup('manual_close_missing_asset')}
          >
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
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => closeWithCleanup('manual_close_runtime_unavailable')}
          >
            <Text style={styles.closeButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => closeWithCleanup('manual_close')}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>View Puzzle</Text>
        <View style={styles.topBarSpacer} />
      </View>
      {navigatorVisible ? (
        <ViroARSceneNavigator
          ref={navigatorRef}
          autofocus
          initialScene={{ scene: ARPuzzleScene as any }}
          viroAppProps={{
            sceneAssetUrl,
            secretCode,
            anchorPosition,
            modelScaleMeters,
            stepId,
            puzzleId,
          }}
          style={styles.navigator}
        />
      ) : (
        <View style={styles.navigator} />
      )}
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
