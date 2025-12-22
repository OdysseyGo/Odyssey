import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { ActiveTourProvider } from '@/contexts/ActiveTourContext';

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

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

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
  const colorTheme = useColorTheme();
  const themeKey = colorTheme;

  return (
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
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="(tour)" options={{ headerShown: false }} />
          <Stack.Screen
            name="tour/[id]"
            options={{
              title: 'Tour',
              headerStyle: { backgroundColor: Colors[themeKey].primary },
              headerTransparent: true,
            }}
          />
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
  );
}
