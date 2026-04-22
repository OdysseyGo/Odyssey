// TutorialContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

// different types of tours, might add more
export type TutorialType = 'GENERAL_TOUR' | 'PROFILE' | 'NONE';

interface TutorialContextProps {
  activeTutorial: TutorialType;
  startTutorial: (type: TutorialType) => void;
  stopTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextProps | undefined>(undefined);

export const TutorialProvider = ({ children }: { children: ReactNode }) => {
  const [activeTutorial, setActiveTutorial] = useState<TutorialType>('NONE');

  const startTutorial = (type: TutorialType) => setActiveTutorial(type);
  const stopTutorial = () => setActiveTutorial('NONE');

  return (
    <TutorialContext.Provider value={{ activeTutorial, startTutorial, stopTutorial }}>
      {children}
    </TutorialContext.Provider>
  );
};

// Custom hook for easier consumption
export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};