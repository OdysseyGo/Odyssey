import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import ActiveTourFAB from '@/components/MapComponents/ActiveTourFAB';
import BackButton from '@/components/common/BackButton';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorTheme = useColorTheme();
  const pathname = usePathname();
  const { tour, isActive, currentStepIndex } = useActiveTour();
  const { t } = useTranslation();

  // Show FAB only when active tour exists and not on map tab
  const showFAB = isActive && tour && pathname !== '/map';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorTheme ?? 'light'].primary,
          tabBarInactiveTintColor: Colors[colorTheme ?? 'light'].tabIconDefault,
          headerShown: true,
          headerTitle: '',
          headerStyle: {
            backgroundColor: Colors[colorTheme ?? 'light'].primary,
          },
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            href: null,
            headerLeft: () => (
              <BackButton
                color={Colors[colorTheme ?? 'light'].white}
                onPress={() => router.navigate('/(tabs)/profile')}
              />
            ),
            tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
          }}
        />
        <Tabs.Screen
          name="tourDisplay"
          options={{
            title: t('tabs.tours'),
            tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: t('tabs.map'),
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
            headerShown: false,
          }}
        />
      </Tabs>

      {/* Floating Action Button for active tour */}
      {showFAB && tour && (
        <ActiveTourFAB
          tourTitle={tour.title}
          currentStep={currentStepIndex + 1}
          totalSteps={tour.steps.length}
          onPress={() => router.navigate('/(tabs)/map')}
        />
      )}
    </View>
  );
}
