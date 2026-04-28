import { NativeModules } from 'react-native';

let cachedViroModule: any | null | undefined;

function hasLinkedViroNativeModules() {
  return Boolean(
    NativeModules?.VRTMaterialManager &&
    (NativeModules?.VRTARSceneNavigator || NativeModules?.VRTSceneNavigator)
  );
}

export function loadViro() {
  if (cachedViroModule !== undefined) {
    return cachedViroModule;
  }

  if (!hasLinkedViroNativeModules()) {
    cachedViroModule = null;
    return cachedViroModule;
  }

  try {
    cachedViroModule = require('@reactvision/react-viro');
  } catch (error) {
    cachedViroModule = null;
  }

  return cachedViroModule;
}

export function isViroAvailable() {
  const viro = loadViro();
  return Boolean(viro && viro.ViroARSceneNavigator);
}
