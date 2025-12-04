import TourDisplayComp from '@/components/TourComponents/TourDisplayComp';
import { View, ScrollView } from 'react-native';
import { exampleTour } from '@/components/TourComponents/TourDisplayComp.config';
import TourListComp from '@/components/TourComponents/TourListComp';

export default function tourDisplay() {
  return (
    <View>
      <ScrollView>
        <TourDisplayComp {...exampleTour} />
        <TourDisplayComp {...exampleTour} />
        <TourDisplayComp {...exampleTour} />
        <TourListComp title="Night Market Tour" author="FoodieGuide" rating={4.9} />
      </ScrollView>
    </View>
  );
}
