import TourDisplayComp from '@/components/TourComponents/TourDisplayComp';
import { View, ScrollView, StyleSheet } from 'react-native';
import { exampleTour } from '@/components/TourComponents/TourDisplayComp.config';
import TourListComp from '@/components/TourComponents/TourListComp';
import CreateTourButton from '@/components/TourCreation/CreateTourButton';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

export default function TourDisplay() {
  const theme = useColorTheme();
  const color = Colors[theme];

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <ScrollView>
        <TourDisplayComp {...exampleTour} />
        <TourDisplayComp {...exampleTour} />
        <TourDisplayComp {...exampleTour} />
        <TourListComp title="Night Market Tour" author="FoodieGuide" rating={4.9} />
      </ScrollView>
      <CreateTourButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
