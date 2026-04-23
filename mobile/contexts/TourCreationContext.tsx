import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  TourCreationData,
  TourLocation,
  createEmptyTourData,
} from '@/components/TourCreation/TourCreation.types';

interface TourCreationContextType {
  tourData: TourCreationData;
  setTourData: (tourData: TourCreationData) => void;
  updateTourData: (updates: Partial<TourCreationData>) => void;
  updateLocation: (updatedLocation: TourLocation) => void;
  resetTourData: () => void;
  selectedLocation: TourLocation | null;
  setSelectedLocation: (location: TourLocation | null) => void;
  editingTourId: number | null;
  originalStepIds: number[];
  setEditingContext: (tourId: number | null, stepIds: number[]) => void;
}

const TourCreationContext = createContext<TourCreationContextType | undefined>(undefined);

export function TourCreationProvider({ children }: { children: ReactNode }) {
  const [tourData, setTourDataState] = useState<TourCreationData>(createEmptyTourData());
  const [selectedLocation, setSelectedLocation] = useState<TourLocation | null>(null);
  const [editingTourId, setEditingTourId] = useState<number | null>(null);
  const [originalStepIds, setOriginalStepIds] = useState<number[]>([]);

  const setTourData = useCallback((nextTourData: TourCreationData) => {
    setTourDataState(nextTourData);
    setSelectedLocation(null);
  }, []);

  const updateTourData = useCallback((updates: Partial<TourCreationData>) => {
    setTourDataState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateLocation = useCallback((updatedLocation: TourLocation) => {
    setTourDataState((prev) => ({
      ...prev,
      locations: prev.locations.map((loc) =>
        loc.id === updatedLocation.id ? updatedLocation : loc
      ),
    }));
  }, []);

  const setEditingContext = useCallback((tourId: number | null, stepIds: number[]) => {
    setEditingTourId(tourId);
    setOriginalStepIds(stepIds);
  }, []);

  const resetTourData = useCallback(() => {
    setTourDataState(createEmptyTourData());
    setSelectedLocation(null);
    setEditingTourId(null);
    setOriginalStepIds([]);
  }, []);

  return (
    <TourCreationContext.Provider
      value={{
        tourData,
        setTourData,
        updateTourData,
        updateLocation,
        resetTourData,
        selectedLocation,
        setSelectedLocation,
        editingTourId,
        originalStepIds,
        setEditingContext,
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
