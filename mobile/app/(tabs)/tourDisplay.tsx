import TourDisplayComp from '@/components/TourComponents/TourDisplayComp';
import { View, ScrollView } from 'react-native';
import { exampleTour } from '@/components/TourComponents/TourDisplayComp.config';
import TourListComp from '@/components/TourComponents/TourListComp';
import TourScrollerComp from '@/components/TourComponents/TourScrollerComp';
import MainTourDisplayComp from '@/components/TourComponents/MainTourDisplayComp';

export default function tourDisplay() {
  return (
    <View>
      <ScrollView>
        <MainTourDisplayComp {...exampleTour} />
        <TourScrollerComp title="Popular Tours" data={[exampleTour, exampleTour, exampleTour,exampleTour,exampleTour,exampleTour,exampleTour,exampleTour]} />
        <TourScrollerComp title="Europe" data={[exampleTour, exampleTour, exampleTour,exampleTour,exampleTour,exampleTour,exampleTour,exampleTour]} />
        <TourScrollerComp title="Asia" data={[exampleTour, exampleTour, exampleTour,exampleTour,exampleTour,exampleTour,exampleTour,exampleTour]} />
        <TourScrollerComp title="Africa" data={[exampleTour, exampleTour, exampleTour,exampleTour,exampleTour,exampleTour,exampleTour,exampleTour]} />
      </ScrollView>
    </View>
  );
}
