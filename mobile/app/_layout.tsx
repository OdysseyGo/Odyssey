import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { ActiveTourProvider } from '@/contexts/ActiveTourContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeProvider as AppThemeProvider } from '@/contexts/ThemeContext';
import '@/i18n/i18n';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    ...Ionicons.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    async function setupNotifications() {
      if (Platform.OS === 'ios' && !Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }

      try {
        const token = await Notifications.getDevicePushTokenAsync();
        
        console.log("APPLE DEVICE TOKEN:", token.data);

        // TODO: Once the user is logged in, you will want to send `token.data` 
      } catch (error) {
        console.error("Error getting push token", error);
      }
    }

    setupNotifications();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);
  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <AppThemeProvider>
      <RootLayoutNavigator />
    </AppThemeProvider>
  );
}

function RootLayoutNavigator() {
  const colorTheme = useColorTheme();
  const themeKey = colorTheme;

  return (
    <LanguageProvider>
      <ActiveTourProvider>
        <ThemeProvider value={themeKey === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack
            screenOptions={{
              headerTitle: '',
              headerShadowVisible: false,
              headerStyle: {
                backgroundColor: Colors[themeKey].primary,
              },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="(tour)" options={{ headerShown: false }} />
            <Stack.Screen name="tour/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
          </Stack>
        </ThemeProvider>
      </ActiveTourProvider>
    </LanguageProvider>
  );
}
