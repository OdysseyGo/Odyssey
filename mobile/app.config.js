import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../.env') });

const bundleIdentifier = process.env.APP_BUNDLE_ID || 'com.app.odyssey.bilkent';
const microphoneUsageDescription =
  'Odyssey includes a third-party AR framework that declares microphone-related APIs. Odyssey does not record or store microphone audio in any app feature.';

export default {
  expo: {
    name: 'Odyssey',
    slug: 'mobile',
    version: '1.0.0',
    platforms: ['ios', 'android'],
    orientation: 'portrait',
    icon: './assets/images/mobile_icon.png',
    scheme: 'mobile',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/mobile_icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      bundleIdentifier: bundleIdentifier,
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription:
          'Odyssey uses your camera for AR puzzle views and photo-based tour challenges.',
        NSMicrophoneUsageDescription:
          microphoneUsageDescription,
        NSLocationWhenInUseUsageDescription:
          'Odyssey uses your location while the app is open to show nearby tours, guide tour navigation, and verify location-based steps.',
        NSPhotoLibraryUsageDescription:
          'Odyssey needs photo library access so you can pick images when creating picture-based tour puzzles.',
        NSMotionUsageDescription:
          'Odyssey uses motion sensors to align AR content and support compass-style puzzle interactions.',
        NSUserTrackingUsageDescription:
          'Odyssey uses tracking to show ads relevant to your interests. You can decline and still use the app.',
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: bundleIdentifier,
    },
    plugins: [
      './scripts/newArchEnabled.js',
      'expo-router',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Odyssey uses your location while the app is open to show nearby tours, guide tour navigation, and verify location-based steps.',
          locationAlwaysAndWhenInUsePermission: false,
          locationAlwaysPermission: false,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
          isAndroidForegroundServiceEnabled: false,
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'Odyssey uses your camera for AR puzzle views and photo-based tour challenges.',
          microphonePermission: microphoneUsageDescription,
          recordAudioAndroid: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission:
            'Odyssey needs photo library access so you can pick images when creating picture-based tour puzzles.',
          cameraPermission:
            'Odyssey uses your camera for AR puzzle views and photo-based tour challenges.',
          microphonePermission: microphoneUsageDescription,
        },
      ],
      [
        '@reactvision/react-viro',
        {
          newArchEnabled: true,
          photosPermission:
            'Odyssey can save captured puzzle and AR images to your photo library when you choose to keep them.',
          cameraPermission:
            'Odyssey uses your camera for AR puzzle views and photo-based tour challenges.',
        },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId:
            process.env.ADMOB_APP_ID_ANDROID || 'ca-app-pub-3940256099942544~3347511713',
          iosAppId: process.env.ADMOB_APP_ID_IOS || 'ca-app-pub-3940256099942544~1458002511',
          userTrackingUsageDescription:
            'Odyssey uses tracking to show ads relevant to your interests.',
        },
      ],
      [
        'expo-tracking-transparency',
        {
          userTrackingPermissionText:
            'Odyssey uses app tracking to measure ad performance and show more relevant ads. You can decline and still use the app.',
        },
      ],
    ],
    extra: {
      envMode: process.env.ENV_MODE || 'production',
    },
    experiments: {
      typedRoutes: true,
    },
  },
};
