// app/tour/[id].tsx
import { Stack, useLocalSearchParams } from 'expo-router';
import { View, Text } from 'react-native';

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: 'Tour details' }} />
      <View style={{ flex: 1, padding: 100, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '700' }}>Tour detail for: {id}</Text>
      </View>
    </>
  );
}
