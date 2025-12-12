// app/(tabs)/profile/index.tsx
import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import { exampleProfileHeader } from '@/components/ProfileComponents/ProfileHeaderComp.config';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import { exampleProfileStats } from '@/components/ProfileComponents/ProfileStatsComp.config';
import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import AuthButton from '@/components/LoginComponents/AuthButton';

// temporary flag – later replace with real auth logic
const IS_LOGGED_IN = false;

export default function Profile() {
  if (!IS_LOGGED_IN) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center', color: '#666' }}>
          You need to be logged in to view your profile.
        </Text>
        <AuthButton title="Oooh I want to log in!" onPress={() => router.push('/login')} />
      </View>
    );
  }

  return (
    <View>
      <ProfileHeaderComp {...exampleProfileHeader} />
      <ProfileStatsComp {...exampleProfileStats} />
    </View>
  );
}
