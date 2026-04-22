import { useEffect, useRef } from 'react';
import { useCopilot } from 'react-native-copilot';
import { useTutorial, TutorialType } from '@/contexts/TutorialContext';

/**
 * Automatically starts a Copilot tutorial when conditions are met.
 * * @param targetTutorialName The name of the tutorial that should run on this screen.
 * @param isReady Boolean indicating if the screen's data (APIs, layouts) is fully loaded.
 * @param onTourStop Optional callback if you need to navigate to another screen when it finishes.
 */
export function useAutoStartTour(
  targetTutorialName: TutorialType, 
  isReady: boolean,
  onTourStop?: () => void
) {
  const { activeTutorial, stopTutorial } = useTutorial();
  const { start, copilotEvents } = useCopilot();
  const hasStartedTour = useRef(false);

  // Handle Starting
  useEffect(() => {
    if (activeTutorial === targetTutorialName && start && isReady && !hasStartedTour.current) {
      hasStartedTour.current = true;
      // Slight delay to ensure React Native has fully painted the UI coordinates
      setTimeout(() => start(), 500);
    }
  }, [activeTutorial, start, isReady, targetTutorialName]);

  // Handle Stopping
  useEffect(() => {
    if (copilotEvents) {
      const handleStop = () => {
        hasStartedTour.current = false;
        stopTutorial(); // Clear the global context
        if (onTourStop) onTourStop(); // Fire optional navigation/callback
      };

      copilotEvents.on('stop', handleStop);
      
      return () => {
        copilotEvents.off('stop', handleStop);
      };
    }
  }, [copilotEvents, stopTutorial, onTourStop]);
}