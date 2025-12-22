import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs, router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';
import { useActiveTour } from '@/contexts/ActiveTourContext';
import ActiveTourFAB from '@/components/MapComponents/ActiveTourFAB';

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
          name="two"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabBarIcon name="gear" color={color} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            headerShown: false,
            tabBarIcon: ({ color }) => <TabBarIcon name="map" color={color} />,
          }}
        />
        <Tabs.Screen
          name="tourDisplay"
          options={{
            title: 'Tours',
            tabBarIcon: ({ color }) => <TabBarIcon name="compass" color={color} />,
            headerRight: () => (
              <Pressable onPress={() => router.push('/search')}>
                {({ pressed }) => (
                  <FontAwesome
                    name="search"
                    size={15}
                    color={Colors[colorTheme ?? 'light'].white}
                    style={{
                      marginRight: 15,
                      opacity: pressed ? 0.5 : 1,
                      backgroundColor: Colors[colorTheme ?? 'light'].backgroundBlack,
                      padding: 10,
                      borderRadius: 20,
                      marginBottom: 5,
                    }}
                  />
                )}
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
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
