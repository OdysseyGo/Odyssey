import path from 'path';
import { config } from 'dotenv';

config({ path: path.resolve(__dirname, '../.env') });

export default {
  expo: {
    name: "Odyssey",
    slug: "mobile",
    version: "1.0.0",
    platforms: ["ios", "android"],
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "mobile",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      bundleIdentifier: "com.sami.odyssey.ar",
      supportsTablet: true,
      infoPlist: {
        "NSCameraUsageDescription": "Odyssey needs camera access for AR exploration.",
        "NSLocationWhenInUseUsageDescription": "Odyssey uses location to persist AR objects.",
        "NSPhotoLibraryUsageDescription": "Allow saving AR captures."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.sami.odyssey.ar"
    },
    plugins: [
      "./scripts/newArchEnabled.js",
      "expo-router",
      [
        "@reactvision/react-viro",
        {
          "newArchEnabled": true,
          "photosPermission": "Allow access to photos to save AR captures.",
          "cameraPermission": "Allow access to the camera for the AR experience."
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};