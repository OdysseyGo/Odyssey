import React from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';
import { ARModel, ARModelAnchor, getArModels } from '@/api/tours';
import { ARPuzzleConfig } from '../TourCreation.types';
import { getViroModule, isViroAvailable, VIRO_UNAVAILABLE_MESSAGE } from '@/utils/viro';

type WizardStep = 'catalog' | 'code' | 'review';

type Props = {
  value?: ARPuzzleConfig;
  onChange: (value: ARPuzzleConfig) => void;
};

type SelectionSceneAppProps = {
  sceneAssetUrl: string;
  secretCode: string;
  anchorPosition: [number, number, number];
  modelScaleMeters: number;
};

const SECRET_CODE_REGEX = /^[A-Za-z0-9]{4,12}$/;
const MODEL_POSITION: [number, number, number] = [0, 0, -1.2];
const MODEL_SCALE: [number, number, number] = [0.25, 0.25, 0.25];
const DEFAULT_MODEL_SCALE_METERS = 1;
const MIN_MODEL_SCALE_METERS = 0.3;
const MAX_MODEL_SCALE_METERS = 10;
const HIGHLIGHT_HEIGHT = 0.18;
const VIRO = loadViro();
const Viro3DObject = VIRO?.Viro3DObject as any;
const ViroARScene = VIRO?.ViroARScene as any;
const ViroARSceneNavigator = VIRO?.ViroARSceneNavigator as any;
const ViroAmbientLight = VIRO?.ViroAmbientLight as any;
const ViroMaterials = VIRO?.ViroMaterials as any;
const ViroPolyline = VIRO?.ViroPolyline as any;
const ViroSphere = VIRO?.ViroSphere as any;
const ViroText = VIRO?.ViroText as any;

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

let materialsReady = false;

function ensureViroMaterials() {
  if (materialsReady) {
    return;
  }

  const viro = getViroModule();
  if (!viro) {
    return;
  }

  viro.ViroMaterials.createMaterials({
    arPuzzleAnchorMarker: {
      lightingModel: 'Constant',
      diffuseColor: '#f97316',
    },
    arPuzzleAnchorLine: {
      lightingModel: 'Constant',
      diffuseColor: '#facc15',
    },
  });
  materialsReady = true;
}

function getAnchorIndex(model: ARModel | null, anchorId: string | null) {
  if (!model || !anchorId) {
    return -1;
  }
  return model.anchors.findIndex((anchor) => anchor.id === anchorId);
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

function ARSelectionScene(props: any) {
  const viro = getViroModule();
  if (!viro) {
    return null;
  }

  const { Viro3DObject, ViroARScene, ViroAmbientLight, ViroPolyline, ViroSphere, ViroText } = viro;
  const appProps = props.sceneNavigator.viroAppProps as SelectionSceneAppProps;
  const sceneAssetUrl = appProps?.sceneAssetUrl ?? '';
  const secretCode = appProps?.secretCode?.trim() || 'Code';
  const anchorPosition = (appProps?.anchorPosition as [number, number, number]) ?? [0, 0.3, -1.2];
  const modelScaleMeters = clamp(
    Number(appProps?.modelScaleMeters ?? DEFAULT_MODEL_SCALE_METERS),
    MIN_MODEL_SCALE_METERS,
    MAX_MODEL_SCALE_METERS
  );
  const modelScale = getScaledModelScale(modelScaleMeters);
  const anchorWorldPosition = toModelWorldPoint(anchorPosition, MODEL_POSITION, modelScale);
  const anchorTopPoint: [number, number, number] = [
    anchorWorldPosition[0],
    anchorWorldPosition[1] + HIGHLIGHT_HEIGHT,
    anchorWorldPosition[2],
  ];

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={600} />
      <Viro3DObject
        source={{ uri: sceneAssetUrl }}
        position={MODEL_POSITION}
        scale={modelScale}
        type="GLB"
      />
      <ViroSphere
        position={anchorWorldPosition}
        radius={0.05}
        materials={['arPuzzleAnchorMarker']}
      />
      <ViroPolyline
        points={[anchorWorldPosition, anchorTopPoint]}
        thickness={0.015}
        materials={['arPuzzleAnchorLine']}
      />
      <ViroText
        text={secretCode}
        width={1}
        height={1}
        position={anchorWorldPosition}
        scale={[0.12, 0.12, 0.12]}
        style={styles.viroText}
      />
      <ViroText
        text={secretCode}
        width={1}
        height={1}
        position={anchorWorldPosition}
        rotation={[0, 180, 0]}
        scale={[0.12, 0.12, 0.12]}
        style={styles.viroText}
      />
    </ViroARScene>
  );
}

export default function ARPuzzleConfigurator({ value, onChange }: Props) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const stylesForTheme = React.useMemo(() => createStyles(color), [color]);
  const insets = useSafeAreaInsets();
  const viroAvailable = isViroAvailable();
  const viro = React.useMemo(() => getViroModule(), []);

  const [models, setModels] = React.useState<ARModel[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [step, setStep] = React.useState<WizardStep>(value ? 'review' : 'catalog');
  const [selectedModelId, setSelectedModelId] = React.useState<number | null>(
    value?.modelId ?? null
  );
  const [secretCode, setSecretCode] = React.useState(value?.secretCode ?? '');
  const [selectedAnchorId, setSelectedAnchorId] = React.useState<string | null>(
    value?.anchorId ?? null
  );
  const [isAnchorSelectorOpen, setIsAnchorSelectorOpen] = React.useState(false);
  const [modelScaleMeters, setModelScaleMeters] = React.useState(
    clamp(
      Number(value?.modelScaleMeters ?? DEFAULT_MODEL_SCALE_METERS),
      MIN_MODEL_SCALE_METERS,
      MAX_MODEL_SCALE_METERS
    )
  );
  const [isScalePanelOpen, setIsScalePanelOpen] = React.useState(false);
  const [sliderWidth, setSliderWidth] = React.useState(0);
  const viroAvailable = isViroAvailable();

  React.useEffect(() => {
    if (materialsReady || !ViroMaterials) {
      return;
    }

    ViroMaterials.createMaterials({
      arPuzzleAnchorMarker: {
        lightingModel: 'Constant',
        diffuseColor: '#f97316',
      },
      arPuzzleAnchorLine: {
        lightingModel: 'Constant',
        diffuseColor: '#facc15',
      },
    });
    materialsReady = true;
  }, []);

  const selectedModel = React.useMemo(
    () => models.find((model) => model.id === selectedModelId) ?? null,
    [models, selectedModelId]
  );
  const selectedAnchor = React.useMemo(
    () => selectedModel?.anchors?.find((anchor) => anchor.id === selectedAnchorId) ?? null,
    [selectedModel, selectedAnchorId]
  );
  const selectedAnchorIndex = React.useMemo(
    () => getAnchorIndex(selectedModel, selectedAnchorId),
    [selectedAnchorId, selectedModel]
  );
  const isSecretCodeValid = SECRET_CODE_REGEX.test(secretCode);

  const loadModels = React.useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const items = await getArModels();
      setModels(items);
      if (!items.length) {
        setError('No AR models are available right now.');
      }
    } catch (loadError) {
      console.error('Failed to load AR models', loadError);
      setError('Failed to load AR models. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadModels();
  }, [loadModels]);

  React.useEffect(() => {
    ensureViroMaterials();
  }, [viro]);

  const handlePickModel = (model: ARModel) => {
    if (!model.anchors.length) {
      setError('This AR model does not have any anchor points yet.');
      return;
    }

    setError('');
    setSelectedModelId(model.id);
    setSelectedAnchorId(model.anchors[0]?.id ?? null);
    setStep('code');
  };

  const openAnchorSelection = () => {
    if (!selectedModel || !isSecretCodeValid) {
      return;
    }
    if (!viroAvailable) {
      setError(VIRO_UNAVAILABLE_MESSAGE);
      return;
    }
    setIsScalePanelOpen(false);
    setIsAnchorSelectorOpen(true);
  };

  const cycleAnchor = (direction: -1 | 1) => {
    if (!selectedModel?.anchors.length) {
      return;
    }

    const currentIndex = selectedAnchorIndex >= 0 ? selectedAnchorIndex : 0;
    const nextIndex =
      (currentIndex + direction + selectedModel.anchors.length) % selectedModel.anchors.length;
    setSelectedAnchorId(selectedModel.anchors[nextIndex]?.id ?? null);
  };

  const confirmAnchorSelection = () => {
    if (!selectedAnchor) {
      return;
    }

    setIsAnchorSelectorOpen(false);
    setIsScalePanelOpen(false);
    setStep('review');
  };

  const updateScaleFromSliderLocation = React.useCallback(
    (locationX: number) => {
      if (sliderWidth <= 0) {
        return;
      }
      const ratio = clamp(locationX / sliderWidth, 0, 1);
      const nextScale =
        MIN_MODEL_SCALE_METERS + ratio * (MAX_MODEL_SCALE_METERS - MIN_MODEL_SCALE_METERS);
      setModelScaleMeters(Number(nextScale.toFixed(2)));
    },
    [sliderWidth]
  );

  const sliderRatio =
    (modelScaleMeters - MIN_MODEL_SCALE_METERS) / (MAX_MODEL_SCALE_METERS - MIN_MODEL_SCALE_METERS);

  const openArPreview = (anchor?: ARModelAnchor | null) => {
    if (!selectedModel || !anchor) return;
    if (!viroAvailable) {
      setError(VIRO_UNAVAILABLE_MESSAGE);
      return;
    }

    router.push({
      pathname: '/(tour)/ar-preview' as any,
      params: {
        sceneAssetUrl: selectedModel.scene_asset_url,
        secretCode,
        anchorX: String(anchor.position.x ?? 0),
        anchorY: String(anchor.position.y ?? 0.3),
        anchorZ: String(anchor.position.z ?? -1.2),
        modelScaleMeters: String(modelScaleMeters),
      },
    });
  };

  const saveConfig = () => {
    if (!selectedModel || !selectedAnchor || !isSecretCodeValid) return;

    onChange({
      modelId: selectedModel.id,
      modelSlug: selectedModel.slug,
      modelName: selectedModel.name,
      previewImageUrl: selectedModel.preview_image_url,
      sceneAssetUrl: selectedModel.scene_asset_url,
      secretCode,
      placementMode: 'anchor',
      anchorId: selectedAnchor.id,
      anchorLabel: selectedAnchor.label,
      anchorPosition: {
        x: selectedAnchor.position.x,
        y: selectedAnchor.position.y,
        z: selectedAnchor.position.z,
      },
      modelScaleMeters,
    });
  };

  const anchorPositionTuple: [number, number, number] = selectedAnchor
    ? [selectedAnchor.position.x, selectedAnchor.position.y, selectedAnchor.position.z]
    : [0, 0.3, -1.2];

  const ViroARSceneNavigator = viro?.ViroARSceneNavigator;

  return (
    <View style={stylesForTheme.container}>
      <Text style={stylesForTheme.title}>AR Puzzle Setup</Text>

      {value && step === 'catalog' ? (
        <View style={stylesForTheme.configChip}>
          <Text style={stylesForTheme.configChipText}>
            Configured: {value.modelName} ({value.anchorLabel})
          </Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={stylesForTheme.centerState}>
          <ActivityIndicator color={color.primary} />
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={stylesForTheme.centerState}>
          <Text style={stylesForTheme.errorText}>{error}</Text>
          <TouchableOpacity style={stylesForTheme.primaryButton} onPress={loadModels}>
            <Text style={stylesForTheme.primaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {!isLoading && !error && step === 'catalog' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={stylesForTheme.catalogRow}
        >
          {models.map((model) => (
            <TouchableOpacity
              key={model.id}
              style={stylesForTheme.catalogCard}
              onPress={() => handlePickModel(model)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: model.preview_image_url }}
                style={stylesForTheme.catalogImage}
              />
              <Text style={stylesForTheme.catalogName}>{model.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      {!isLoading && !error && step === 'code' && selectedModel ? (
        <View style={stylesForTheme.stepContainer}>
          <View style={stylesForTheme.selectedModelCard}>
            <Image
              source={{ uri: selectedModel.preview_image_url }}
              style={stylesForTheme.selectedModelImage}
            />
            <View style={stylesForTheme.selectedModelMeta}>
              <Text style={stylesForTheme.selectedModelName}>{selectedModel.name}</Text>
              <Text style={stylesForTheme.selectedModelDetail}>
                {selectedModel.anchors.length} anchor{selectedModel.anchors.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>

          <Text style={stylesForTheme.label}>Enter Secret Code</Text>
          <TextInput
            value={secretCode}
            onChangeText={setSecretCode}
            style={stylesForTheme.input}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={12}
            placeholder="4-12 letters or numbers"
            placeholderTextColor={color.placeholder}
          />
          {!isSecretCodeValid && secretCode.length > 0 ? (
            <Text style={stylesForTheme.errorText}>Use 4-12 letters or numbers.</Text>
          ) : null}

          <View style={stylesForTheme.buttonRow}>
            <TouchableOpacity
              style={stylesForTheme.secondaryButton}
              onPress={() => setStep('catalog')}
            >
              <Text style={stylesForTheme.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                stylesForTheme.primaryButton,
                !isSecretCodeValid && stylesForTheme.disabledButton,
              ]}
              onPress={openAnchorSelection}
              disabled={!isSecretCodeValid}
            >
              <Text style={stylesForTheme.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {!isLoading && !error && step === 'review' && selectedModel && selectedAnchor ? (
        <View style={stylesForTheme.stepContainer}>
          <View style={stylesForTheme.reviewCard}>
            <Text style={stylesForTheme.reviewLine}>Model: {selectedModel.name}</Text>
            <Text style={stylesForTheme.reviewLine}>Code: {secretCode}</Text>
            <Text style={stylesForTheme.reviewLine}>Position: {selectedAnchor.label}</Text>
          </View>

              <View style={stylesForTheme.reviewActions}>
                <TouchableOpacity
              style={stylesForTheme.secondaryButton}
              onPress={() => {
                setIsScalePanelOpen(false);
                setIsAnchorSelectorOpen(true);
              }}
            >
              <Text style={stylesForTheme.secondaryButtonText}>Change anchor</Text>
            </TouchableOpacity>
                <TouchableOpacity
                  style={stylesForTheme.eyePreviewButton}
                  onPress={() => openArPreview(selectedAnchor)}
                  disabled={!viroAvailable}
                >
                  <Ionicons name="eye-outline" size={20} color={color.white} />
                  <Text style={stylesForTheme.eyePreviewText}>
                    {viroAvailable ? 'Preview in AR' : 'AR unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>

          <View style={stylesForTheme.buttonRow}>
            <TouchableOpacity
              style={stylesForTheme.secondaryButton}
              onPress={() => setStep('code')}
            >
              <Text style={stylesForTheme.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={stylesForTheme.primaryButton} onPress={saveConfig}>
              <Text style={stylesForTheme.primaryButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <Modal visible={isAnchorSelectorOpen} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={[stylesForTheme.fullscreenContainer, { paddingTop: insets.top + 8 }]}>
          <View style={stylesForTheme.fullscreenHeader}>
            <TouchableOpacity
              style={stylesForTheme.headerIconButton}
              onPress={() => {
                setIsScalePanelOpen(false);
                setIsAnchorSelectorOpen(false);
              }}
            >
              <Ionicons name="arrow-back" size={20} color={color.white} />
            </TouchableOpacity>
            <View style={stylesForTheme.headerTextWrap}>
              <Text style={stylesForTheme.fullscreenTitle}>Anchor Selection</Text>
              <Text style={stylesForTheme.fullscreenSubtitle}>
                Cycle through anchors in AR and choose where the code should be hidden.
              </Text>
            </View>
            <View style={stylesForTheme.headerSpacer} />
          </View>

          {selectedModel && viroAvailable ? (
            <>
              <View style={stylesForTheme.fullscreenSceneFrame}>
                {ViroARSceneNavigator ? (
                  <ViroARSceneNavigator
                    autofocus
                    initialScene={{ scene: ARSelectionScene as any }}
                    viroAppProps={{
                      sceneAssetUrl: selectedModel.scene_asset_url,
                      secretCode,
                      anchorPosition: anchorPositionTuple,
                      modelScaleMeters,
                    }}
                    style={stylesForTheme.navigator}
                  />
                ) : (
                  <View style={stylesForTheme.centerState}>
                    <Text style={stylesForTheme.errorText}>{VIRO_UNAVAILABLE_MESSAGE}</Text>
                  </View>
                )}
              </View>

              <View style={[stylesForTheme.scaleButtonWrap, { top: insets.top + 56 }]}>
                <TouchableOpacity
                  style={stylesForTheme.scaleButton}
                  onPress={() => setIsScalePanelOpen((prev) => !prev)}
                >
                  <Ionicons name="resize-outline" size={18} color={color.white} />
                </TouchableOpacity>
              </View>

              {isScalePanelOpen ? (
                <View style={[stylesForTheme.scalePanel, { top: insets.top + 108 }]}>
                  <Text style={stylesForTheme.scalePanelTitle}>Model Scale</Text>
                  <Text style={stylesForTheme.scalePanelValue}>
                    {modelScaleMeters.toFixed(2)} m
                  </Text>
                  <View
                    style={stylesForTheme.scaleTrack}
                    onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(event) =>
                      updateScaleFromSliderLocation(event.nativeEvent.locationX)
                    }
                    onResponderMove={(event) =>
                      updateScaleFromSliderLocation(event.nativeEvent.locationX)
                    }
                  >
                    <View
                      style={[stylesForTheme.scaleTrackFill, { width: `${sliderRatio * 100}%` }]}
                    />
                    <View
                      style={[
                        stylesForTheme.scaleThumb,
                        {
                          left: sliderWidth > 0 ? sliderRatio * (sliderWidth - 20) : 0,
                        },
                      ]}
                    />
                  </View>
                  <View style={stylesForTheme.scaleBoundsRow}>
                    <Text style={stylesForTheme.scaleBoundText}>0.30m</Text>
                    <Text style={stylesForTheme.scaleBoundText}>10.00m</Text>
                  </View>
                </View>
              ) : null}

              <View style={stylesForTheme.selectorBottomBar}>
                <View style={stylesForTheme.selectorSummary}>
                  <Text style={stylesForTheme.selectorSummaryTitle}>
                    {selectedAnchor ? selectedAnchor.label : 'No anchor selected'}
                  </Text>
                  <Text style={stylesForTheme.selectorSummaryText}>
                    {selectedModel.anchors.length > 0 && selectedAnchorIndex >= 0
                      ? `${selectedAnchorIndex + 1} / ${selectedModel.anchors.length}`
                      : `0 / ${selectedModel.anchors.length}`}
                  </Text>
                  <Text style={stylesForTheme.selectorSummaryText}>
                    Scale: {modelScaleMeters.toFixed(2)}m
                  </Text>
                </View>

                <View style={stylesForTheme.anchorCycleRow}>
                  <TouchableOpacity
                    style={stylesForTheme.anchorCycleButton}
                    onPress={() => cycleAnchor(-1)}
                  >
                    <Ionicons name="chevron-back" size={18} color={color.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={stylesForTheme.anchorCycleButton}
                    onPress={() => cycleAnchor(1)}
                  >
                    <Ionicons name="chevron-forward" size={18} color={color.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={stylesForTheme.selectorConfirmButton}
                    onPress={confirmAnchorSelection}
                  >
                    <Text style={stylesForTheme.selectorConfirmText}>Confirm Anchor</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={stylesForTheme.centerState}>
              <Text style={stylesForTheme.errorText}>
                {selectedModel ? 'AR is unavailable in this runtime.' : 'Select an AR model first.'}
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  viroText: {
    fontFamily: 'Arial',
    fontSize: 22,
    color: '#ffffff',
    textAlignVertical: 'center',
    textAlign: 'center',
  },
});

const createStyles = (color: any) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    title: {
      fontSize: 15,
      fontWeight: '700',
      color: color.text,
    },
    centerState: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 12,
    },
    errorText: {
      color: '#dc2626',
      fontSize: 13,
      fontWeight: '500',
    },
    catalogRow: {
      gap: 12,
      paddingVertical: 4,
      paddingRight: 8,
    },
    catalogCard: {
      width: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.background,
      overflow: 'hidden',
    },
    catalogImage: {
      width: '100%',
      height: 100,
      backgroundColor: color.foreground,
    },
    catalogName: {
      color: color.text,
      fontSize: 13,
      fontWeight: '600',
      padding: 10,
    },
    stepContainer: {
      gap: 12,
    },
    selectedModelCard: {
      flexDirection: 'row',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.background,
      overflow: 'hidden',
    },
    selectedModelImage: {
      width: 108,
      height: 90,
      backgroundColor: color.foreground,
    },
    selectedModelMeta: {
      flex: 1,
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 12,
    },
    selectedModelName: {
      color: color.text,
      fontSize: 15,
      fontWeight: '700',
    },
    selectedModelDetail: {
      color: color.placeholder,
      fontSize: 13,
      fontWeight: '500',
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: color.text,
    },
    input: {
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: 10,
      height: 44,
      paddingHorizontal: 12,
      color: color.text,
      backgroundColor: color.background,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 8,
    },
    primaryButton: {
      flex: 1,
      height: 42,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primary,
    },
    primaryButtonText: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
    },
    secondaryButton: {
      flex: 1,
      height: 42,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: color.borderLight,
      backgroundColor: color.background,
    },
    secondaryButtonText: {
      color: color.text,
      fontSize: 14,
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.5,
    },
    reviewCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: color.borderLight,
      padding: 12,
      gap: 6,
      backgroundColor: color.background,
    },
    reviewLine: {
      color: color.text,
      fontSize: 14,
    },
    reviewActions: {
      gap: 8,
    },
    eyePreviewButton: {
      height: 42,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      backgroundColor: '#1f2937',
    },
    eyePreviewText: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
    },
    configChip: {
      borderWidth: 1,
      borderColor: color.borderLight,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      backgroundColor: color.background,
    },
    configChipText: {
      color: color.text,
      fontSize: 13,
      fontWeight: '600',
    },
    fullscreenContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    fullscreenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 12,
      zIndex: 2,
    },
    headerIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    headerTextWrap: {
      flex: 1,
      gap: 2,
    },
    fullscreenTitle: {
      color: color.white,
      fontSize: 16,
      fontWeight: '700',
    },
    fullscreenSubtitle: {
      color: 'rgba(255,255,255,0.75)',
      fontSize: 12,
      fontWeight: '500',
    },
    headerSpacer: {
      width: 40,
      height: 40,
    },
    fullscreenSceneFrame: {
      flex: 1,
    },
    navigator: {
      flex: 1,
    },
    scaleButtonWrap: {
      position: 'absolute',
      right: 16,
      zIndex: 6,
    },
    scaleButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(15,23,42,0.82)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.3)',
    },
    scalePanel: {
      position: 'absolute',
      right: 16,
      width: 220,
      borderRadius: 12,
      padding: 12,
      gap: 8,
      backgroundColor: 'rgba(2,6,23,0.95)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      zIndex: 6,
    },
    scalePanelTitle: {
      color: color.white,
      fontSize: 13,
      fontWeight: '700',
    },
    scalePanelValue: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 13,
      fontWeight: '600',
    },
    scaleTrack: {
      height: 10,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.2)',
      position: 'relative',
      justifyContent: 'center',
    },
    scaleTrackFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: 8,
      backgroundColor: color.primary,
    },
    scaleThumb: {
      position: 'absolute',
      top: -5,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
      borderWidth: 2,
      borderColor: color.primary,
    },
    scaleBoundsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    scaleBoundText: {
      color: 'rgba(255,255,255,0.65)',
      fontSize: 11,
      fontWeight: '500',
    },
    selectorBottomBar: {
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: 'rgba(2,6,23,0.92)',
    },
    selectorSummary: {
      gap: 4,
    },
    selectorSummaryTitle: {
      color: color.white,
      fontSize: 15,
      fontWeight: '700',
    },
    selectorSummaryText: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      fontWeight: '500',
    },
    anchorCycleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    anchorCycleButton: {
      width: 48,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.background,
    },
    selectorConfirmButton: {
      flex: 1,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: color.primary,
    },
    selectorConfirmText: {
      color: color.white,
      fontSize: 14,
      fontWeight: '700',
    },
  });
