import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import { exampleProfileHeader } from '@/components/ProfileComponents/ProfileHeaderComp.config';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import { View } from 'react-native';
import { exampleProfileStats } from '@/components/ProfileComponents/ProfileStatsComp.config';

export default function Profile() {
  return (
    <View>
      <ProfileHeaderComp {...exampleProfileHeader} />
      <ProfileStatsComp {...exampleProfileStats} />
    </View>
  );
}
