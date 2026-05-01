import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Tour as ApiTour, TourStep as ApiTourStep } from '@/api/tours';
import {
  Tour,
  TourStep,
  StoryStep,
  PuzzleStep,
  Puzzle,
} from '@/components/TourStepComponents/TourStep.config';

import { ApiError } from '@/api/APIClient';
import { getInProgressTour } from '@/api/tourProgress';

interface ActiveTourState {
  tour: Tour | null;
  progressId: number | null;
  isActive: boolean;
  currentStepIndex: number;
  highestStepIndex: number;
  solvedSteps: Set<string>;
  locationConfirmedSteps: Set<string>;
  stepAnswers: Map<string, string>;
  stepAttempts: Map<string, number>;
  earnedXP: number;
  skipCount: number;
  wrongAnswerCount: number;
}

interface ActiveTourContextType extends ActiveTourState {
  startTour: (apiTour: ApiTour, progressId: number) => void;
  resumeActiveTour: () => Promise<void>;
  endTour: () => void;
  setCurrentStepIndex: (index: number) => void;
  setHighestStepIndex: (index: number) => void;
  solveStep: (stepId: string, xpReward?: number) => void;
  confirmLocation: (stepId: string) => void;
  recordSkip: (countsAsMistake?: boolean) => void;
  recordWrongAnswer: () => void;
  recordAnswer: (stepId: string, answer: string) => void;
  recordAttempt: (stepId: string) => void;
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
  stepAnswers: new Map(),
  stepAttempts: new Map(),
  earnedXP: 0,
  skipCount: 0,
  wrongAnswerCount: 0,
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
      stepAnswers: new Map(),
      stepAttempts: new Map(),
      earnedXP: 0,
      skipCount: 0,
      wrongAnswerCount: 0,
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

  const recordSkip = useCallback((countsAsMistake = true) => {
    setState((prev) => ({
      ...prev,
      skipCount: prev.skipCount + 1,
      wrongAnswerCount: countsAsMistake ? prev.wrongAnswerCount + 1 : prev.wrongAnswerCount,
    }));
  }, []);

  const recordWrongAnswer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      wrongAnswerCount: prev.wrongAnswerCount + 1,
    }));
  }, []);

  const recordAnswer = useCallback((stepId: string, answer: string) => {
    setState((prev) => {
      const next = new Map(prev.stepAnswers);
      next.set(stepId, answer);
      return { ...prev, stepAnswers: next };
    });
  }, []);

  const recordAttempt = useCallback((stepId: string) => {
    setState((prev) => {
      const next = new Map(prev.stepAttempts);
      next.set(stepId, (next.get(stepId) ?? 0) + 1);
      return { ...prev, stepAttempts: next };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: 0,
      solvedSteps: new Set(),
      locationConfirmedSteps: new Set(),
      stepAnswers: new Map(),
      stepAttempts: new Map(),
      earnedXP: 0,
      skipCount: 0,
      wrongAnswerCount: 0,
    }));
  }, []);

  const resumeActiveTour = useCallback(async () => {
    if (state.isActive) return;

    try {
      const activeProgress = await getInProgressTour();
      if (!activeProgress || !activeProgress.id) {
        console.log('No active tour found in background check.');
        return;
      }

      if (!activeProgress.tour_snapshot) {
        console.warn('Active progress has no tour_snapshot; cannot resume.');
        return;
      }
      const internalTour = mapApiTourToInternalTour(activeProgress.tour_snapshot);

      let currentStepIdx = 0;
      if (activeProgress.current_step_id) {
        const targetStepId = String(activeProgress.current_step_id);

        currentStepIdx = internalTour.steps.findIndex((s) => s.id === targetStepId);

        if (currentStepIdx === -1) {
          console.warn('Warning: Step ID not found in tour!');
          currentStepIdx = 0;
        }
      }

      const restoredSolvedSteps = new Set<string>();
      const restoredLocationConfirmedSteps = new Set<string>();
      for (let i = 0; i < currentStepIdx; i++) {
        restoredSolvedSteps.add(internalTour.steps[i].id);
        restoredLocationConfirmedSteps.add(internalTour.steps[i].id);
      }

      setState({
        tour: internalTour,
        progressId: activeProgress.id,
        isActive: true,
        currentStepIndex: currentStepIdx,
        highestStepIndex: currentStepIdx,
        solvedSteps: restoredSolvedSteps,
        locationConfirmedSteps: restoredLocationConfirmedSteps,
        stepAnswers: new Map(),
        stepAttempts: new Map(
          Object.entries(activeProgress.step_attempt_counts ?? {}).map(([k, v]) => [k, v])
        ),
        earnedXP: activeProgress.total_xp,
        skipCount: activeProgress.skip_count,
        wrongAnswerCount: activeProgress.wrong_attempt_count,
      });
    } catch (error: any) {
      if (error instanceof ApiError && error.statusCode === 401) {
        setState(initialState);
        return;
      }

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
        recordSkip,
        recordWrongAnswer,
        recordAnswer,
        recordAttempt,
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
