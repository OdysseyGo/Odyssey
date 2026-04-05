import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Tour as ApiTour, TourStep as ApiTourStep } from '@/api/tours';
import {
  Tour,
  TourStep,
  StoryStep,
  PuzzleStep,
  Puzzle,
} from '@/components/TourStepComponents/TourStep.config';

import { getInProgressTour } from '@/api/tourProgress';
import { getTour } from '@/api/tours';

interface ActiveTourState {
  tour: Tour | null;
  progressId: number | null;
  isActive: boolean;
  currentStepIndex: number;
  highestStepIndex: number;
  solvedSteps: Set<string>;
  locationConfirmedSteps: Set<string>;
  earnedXP: number;
}

interface ActiveTourContextType extends ActiveTourState {
  startTour: (apiTour: ApiTour, progressId: number) => void;
  resumeActiveTour: () => Promise<void>;
  endTour: () => void;
  setCurrentStepIndex: (index: number) => void;
  setHighestStepIndex: (index: number) => void;
  solveStep: (stepId: string, xpReward?: number) => void;
  confirmLocation: (stepId: string) => void;
  resetProgress: () => void;
}

const initialState: ActiveTourState = {
  tour: null,
  progressId: null,
  isActive: false,
  currentStepIndex: 0,
  highestStepIndex: 0,
  solvedSteps: new Set(),
  locationConfirmedSteps: new Set(),
  earnedXP: 0,
};

const ActiveTourContext = createContext<ActiveTourContextType | undefined>(undefined);

/**
 * Maps an API tour to the internal Tour format with puzzles
 */
function mapApiTourToInternalTour(apiTour: ApiTour): Tour {
  const steps: TourStep[] = apiTour.steps.map((apiStep, index) => {
    const baseStep = {
      id: apiStep.id.toString(),
      title: apiStep.title,
      coordinate: {
        latitude: parseFloat(apiStep.latitude),
        longitude: parseFloat(apiStep.longitude),
      },
    };
    // If the step has a puzzle from the API, convert it
    if (apiStep.puzzle) {
      const puzzle = mapApiPuzzleToInternal(apiStep.puzzle);
      if (puzzle) {
        return {
          ...baseStep,
          type: 'puzzle' as const,
          puzzle,
          description: apiStep.description,
          requiresLocationConfirmation: true, // All puzzle steps require location confirmation
        } as PuzzleStep;
      }
    }

    // Default to story step
    return {
      ...baseStep,
      type: 'story' as const,
      description: apiStep.description,
      images: apiStep.image ? [apiStep.image] : undefined,
    } as StoryStep;
  });

  return {
    id: apiTour.id.toString(),
    title: apiTour.title,
    description: apiTour.description,
    coverImageUri:
      apiTour.steps?.[0]?.image || `https://picsum.photos/800/400?random=${apiTour.id}`,
    steps,
  };
}

/**
 * Maps an API puzzle to the internal Puzzle format (only multiple-choice supported)
 */
function mapApiPuzzleToInternal(apiPuzzle: ApiTour['steps'][0]['puzzle']): Puzzle | null {
  if (!apiPuzzle) return null;

  // Only TRIVIA puzzles with multiple choice options are supported

  if (
    apiPuzzle.puzzle_type === 'TRIVIA' &&
    apiPuzzle.options &&
    Array.isArray(apiPuzzle.options) &&
    apiPuzzle.options.length > 0
  ) {
    return {
      type: 'multiple-choice',
      question: apiPuzzle.question,
      options: apiPuzzle.options.map((option: string, idx: number) => ({
        id: String.fromCharCode(97 + idx), // a, b, c, d
        text: option,
        isCorrect: option === apiPuzzle.correct_answer,
      })),
    };
  }

  return null;
}

export function ActiveTourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActiveTourState>(initialState);

  const startTour = useCallback((apiTour: ApiTour, progressId: number) => {
    const tour = mapApiTourToInternalTour(apiTour);
    setState({
      tour,
      progressId,
      isActive: true,
      currentStepIndex: 0,
      highestStepIndex: 0,
      solvedSteps: new Set(),
      locationConfirmedSteps: new Set(),
      earnedXP: 0,
    });
  }, []);

  const endTour = useCallback(() => {
    setState(initialState);
  }, []);

  const setHighestStepIndex = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      highestStepIndex: Math.max(prev.highestStepIndex, index),
    }));
  }, []);

  const setCurrentStepIndex = useCallback((index: number) => {
    setState((prev) => ({ ...prev, currentStepIndex: index }));
  }, []);

  const solveStep = useCallback((stepId: string, xpReward: number = 10) => {
    setState((prev) => ({
      ...prev,
      solvedSteps: new Set([...prev.solvedSteps, stepId]),
      earnedXP: prev.earnedXP + xpReward,
    }));
  }, []);

  const confirmLocation = useCallback((stepId: string) => {
    setState((prev) => ({
      ...prev,
      locationConfirmedSteps: new Set([...prev.locationConfirmedSteps, stepId]),
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: 0,
      solvedSteps: new Set(),
      locationConfirmedSteps: new Set(),
      earnedXP: 0,
    }));
  }, []);

  const resumeActiveTour = useCallback(async () => {
    if (state.isActive) return;

    try {
      const activeProgress = await getInProgressTour();
      //console.log(activeProgress);
      if (!activeProgress || !activeProgress.id) {
        console.log('No active tour found in background check.');
        return;
      }

      const apiTour = await getTour(activeProgress.tour.id);
      const internalTour = mapApiTourToInternalTour(apiTour);

      let currentStepIdx = 0;
      if (activeProgress.current_step) {
        const targetStepId =
          typeof activeProgress.current_step === 'object'
            ? String(activeProgress.current_step.id)
            : String(activeProgress.current_step);

        currentStepIdx = internalTour.steps.findIndex((s) => s.id === targetStepId);

        if (currentStepIdx === -1) {
          console.warn('Warning: Step ID not found in tour!');
          currentStepIdx = 0;
        }
      }

      const restoredSolvedSteps = new Set<string>();
      for (let i = 0; i < currentStepIdx; i++) {
        restoredSolvedSteps.add(internalTour.steps[i].id);
      }

      setState({
        tour: internalTour,
        progressId: activeProgress.id,
        isActive: true,
        currentStepIndex: currentStepIdx,
        highestStepIndex: currentStepIdx,
        solvedSteps: restoredSolvedSteps,
        locationConfirmedSteps: new Set(),
        earnedXP: activeProgress.total_xp,
      });
    } catch (error: any) {
      console.error("Couldn't fetch current active tour ", error);
    }
  }, [state.isActive]);

  return (
    <ActiveTourContext.Provider
      value={{
        ...state,
        startTour,
        resumeActiveTour,
        endTour,
        setCurrentStepIndex,
        setHighestStepIndex,
        solveStep,
        confirmLocation,
        resetProgress,
      }}
    >
      {children}
    </ActiveTourContext.Provider>
  );
}

export function useActiveTour() {
  const context = useContext(ActiveTourContext);
  if (!context) {
    throw new Error('useActiveTour must be used within an ActiveTourProvider');
  }
  return context;
}
