import { useEffect, useRef, RefObject } from 'react';
import { ScrollView } from 'react-native';
import { useCopilot } from 'react-native-copilot';
import { useTutorial, TutorialType } from '@/contexts/TutorialContext';

export function useAutoStartTour(
  targetTutorialName: TutorialType, 
  isReady: boolean,
  // 1. Add the scroll ref here as the 3rd parameter
  scrollViewRef?: RefObject<ScrollView | null>, 
  // 2. Push the optional callback to the 4th parameter
  onTourStop?: () => void 
) {
  const { activeTutorial, stopTutorial } = useTutorial();
  const { start, copilotEvents } = useCopilot();
  const hasStartedTour = useRef(false);

  // Handle Starting
  useEffect(() => {
    if (activeTutorial === targetTutorialName && start && isReady && !hasStartedTour.current) {
      hasStartedTour.current = true;
      
      // Force scroll to top if the ref was provided!
      if (scrollViewRef?.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      setTimeout(() => start(), 200);
    }
  }, [activeTutorial, start, isReady, targetTutorialName, scrollViewRef]);

  // Handle Stopping
  useEffect(() => {
    if (copilotEvents) {
      const handleStop = () => {
        hasStartedTour.current = false;
        stopTutorial(); 
        if (onTourStop) onTourStop(); 
      };

      copilotEvents.on('stop', handleStop);
      
      return () => {
        copilotEvents.off('stop', handleStop);
      };
    }
  }, [copilotEvents, stopTutorial, onTourStop]);
}