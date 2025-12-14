import { View } from 'react-native';
import { useMemo, useState } from 'react';

import { MapScreenStyle } from './MapScreen.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import BottomSlider from './BottomSlider';
import { exampleBottomSlider } from './BottomSlider.config';
import TourMap from './TourMap';
import { getVisibleMarkers, getVisibleRoute } from '../TourStepComponents/TourNavigation.config';

export default function MapScreen() {
  const theme = useColorTheme();
  const styles = useMemo(() => MapScreenStyle(theme), [theme]);

  const { tour } = exampleBottomSlider;
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [solvedSteps, setSolvedSteps] = useState<Set<string>>(new Set());

  const visibleMarkers = useMemo(
    () => getVisibleMarkers(tour, currentStepIndex, solvedSteps),
    [tour, currentStepIndex, solvedSteps]
  );

  const visibleRoute = useMemo(
    () => getVisibleRoute(tour, currentStepIndex, solvedSteps),
    [tour, currentStepIndex, solvedSteps]
  );

  const initialRegion = useMemo(
    () => ({
      latitude: tour.steps[0].coordinate.latitude,
      longitude: tour.steps[0].coordinate.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    [tour]
  );

  const handleCurrentStepChange = (stepIndex: number) => {
    setCurrentStepIndex(stepIndex);
  };

  const handleSolvedStepsChange = (newSolvedSteps: Set<string>) => {
    setSolvedSteps(newSolvedSteps);
  };

  return (
    <View style={styles.container}>
      <TourMap
        markers={visibleMarkers}
        route={visibleRoute}
        initialRegion={initialRegion}
        currentStepIndex={currentStepIndex}
        tour={tour}
      />

      <BottomSlider
        tour={tour}
        onCurrentStepChange={handleCurrentStepChange}
        onSolvedStepsChange={handleSolvedStepsChange}
      />
    </View>
  );
}
