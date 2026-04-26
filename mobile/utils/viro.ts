import { NativeModules } from 'react-native';

type ViroModule = typeof import('@reactvision/react-viro');

let cachedViroModule: ViroModule | null | undefined;

export function isViroAvailable() {
  return Boolean(
    NativeModules.VRTARSceneNavigatorModule &&
    NativeModules.VRTAnimationManager &&
    NativeModules.VRTMaterialManager
  );
}

export function getViroModule(): ViroModule | null {
  if (cachedViroModule !== undefined) {
    return cachedViroModule;
  }

  if (!isViroAvailable()) {
    cachedViroModule = null;
    return cachedViroModule;
  }

  cachedViroModule = require('@reactvision/react-viro') as ViroModule;
  return cachedViroModule;
}

export const VIRO_UNAVAILABLE_MESSAGE =
  'AR preview is not available in this build. Use a development build with the Viro native plugin installed.';
