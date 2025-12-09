import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import { exampleProfileHeader } from '@/components/ProfileComponents/ProfileHeaderComp.config';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import { Button, Touchable, TouchableOpacity, View, Text } from 'react-native';
import { exampleProfileStats } from '@/components/ProfileComponents/ProfileStatsComp.config';
import { router } from 'expo-router';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';


export default function Profile() {
  return (
    <View>
      <ProfileHeaderComp {...exampleProfileHeader} />
      <ProfileStatsComp {...exampleProfileStats} />
      <AuthSubButton title='Login'
        onPress={() => router.push('/login')}
      >
      </AuthSubButton>
    </View>
  );
}
