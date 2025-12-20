import { View, ScrollView } from 'react-native';
import { exampleTour } from '@/components/TourComponents/TourDisplayComp.config';
import TourScrollerComp from '@/components/TourComponents/TourScrollerComp';
import FeaturedTourCarousel from '@/components/TourComponents/FeaturedTourCarousel';
import { exampleFeaturedTours } from '@/components/TourComponents/FeaturedTourCarousel.config';

export default function tourDisplay() {
  return (
    <View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FeaturedTourCarousel tours={exampleFeaturedTours} autoPlayInterval={5000} />
        <TourScrollerComp
          title="Popular Tours"
          data={[
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
          ]}
        />
        <TourScrollerComp
          title="Europe"
          data={[
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
          ]}
        />
        <TourScrollerComp
          title="Asia"
          data={[
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
          ]}
        />
        <TourScrollerComp
          title="Africa"
          data={[
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
            exampleTour,
          ]}
        />
      </ScrollView>
    </View>
  );
}
