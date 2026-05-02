import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../.env') });

const bundleIdentifier = process.env.APP_BUNDLE_ID || 'com.app.odyssey.bilkent';

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
        NSCameraUsageDescription: 'Odyssey needs camera access for AR exploration.',
        NSLocationWhenInUseUsageDescription: 'Odyssey uses location to persist AR objects.',
        NSPhotoLibraryUsageDescription: 'Allow saving AR captures.',
        NSUserTrackingUsageDescription:
          'Odyssey uses tracking to show ads relevant to your interests. You can decline and still use the app.',
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
      'expo-camera',
      [
        '@reactvision/react-viro',
        {
          newArchEnabled: true,
          photosPermission: 'Allow access to photos to save AR captures.',
          cameraPermission: 'Allow access to the camera for the AR experience.',
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
            'Odyssey uses tracking to show ads relevant to your interests.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
