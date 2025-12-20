import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  TourCreationData,
  TourLocation,
  createEmptyTourData,
} from '@/components/TourCreation/TourCreation.types';

interface TourCreationContextType {
  tourData: TourCreationData;
  updateTourData: (updates: Partial<TourCreationData>) => void;
  updateLocation: (updatedLocation: TourLocation) => void;
  resetTourData: () => void;
  selectedLocation: TourLocation | null;
  setSelectedLocation: (location: TourLocation | null) => void;
}

const TourCreationContext = createContext<TourCreationContextType | undefined>(undefined);

export function TourCreationProvider({ children }: { children: ReactNode }) {
  const [tourData, setTourData] = useState<TourCreationData>(createEmptyTourData());
  const [selectedLocation, setSelectedLocation] = useState<TourLocation | null>(null);

  const updateTourData = useCallback((updates: Partial<TourCreationData>) => {
    setTourData((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateLocation = useCallback((updatedLocation: TourLocation) => {
    setTourData((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) =>
        loc.id === updatedLocation.id ? updatedLocation : loc
      ),
    }));
  }, []);

  const resetTourData = useCallback(() => {
    setTourData(createEmptyTourData());
    setSelectedLocation(null);
  }, []);

  return (
    <TourCreationContext.Provider
      value={{
        tourData,
        updateTourData,
        updateLocation,
        resetTourData,
        selectedLocation,
        setSelectedLocation,
      }}
    >
      {children}
    </TourCreationContext.Provider>
  );
}

export function useTourCreation() {
  const context = useContext(TourCreationContext);
  if (context === undefined) {
    throw new Error('useTourCreation must be used within a TourCreationProvider');
  }
  return context;
}
