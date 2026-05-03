import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  ARPuzzleConfig,
  Puzzle,
  TourCreationData,
  TourLocation,
  createEmptyTourData,
} from '@/components/TourCreation/TourCreation.types';
import { Tour } from '@/api/tours';

type TourCreationMode = 'create' | 'edit';

interface TourCreationContextType {
  tourData: TourCreationData;
  mode: TourCreationMode;
  originalSnapshot: TourCreationData | null;
  updateTourData: (updates: Partial<TourCreationData>) => void;
  updateLocation: (updatedLocation: TourLocation) => void;
  initializeFromExistingTour: (tour: Tour) => void;
  startCreateMode: () => void;
  resetTourData: () => void;
  selectedLocation: TourLocation | null;
  setSelectedLocation: (location: TourLocation | null) => void;
}

const TourCreationContext = createContext<TourCreationContextType | undefined>(undefined);

export function TourCreationProvider({ children }: { children: ReactNode }) {
  const [tourData, setTourData] = useState<TourCreationData>(createEmptyTourData());
  const [mode, setMode] = useState<TourCreationMode>('create');
  const [originalSnapshot, setOriginalSnapshot] = useState<TourCreationData | null>(null);
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

  const mapPuzzle = useCallback((tourStep: Tour['steps'][number]): Puzzle | undefined => {
    const sourcePuzzle = tourStep.puzzle;
    if (!sourcePuzzle) return undefined;

    const mappedBase: Puzzle = {
      puzzle_type: sourcePuzzle.puzzle_type,
      question: sourcePuzzle.question || '',
      hint: sourcePuzzle.hint || '',
      options: [],
      correctAnswer: '',
    };

    if (sourcePuzzle.puzzle_type === 'TRIVIA') {
      return {
        ...mappedBase,
        options: sourcePuzzle.trivia?.options || ['', ''],
        correctAnswer: sourcePuzzle.trivia?.correct_answer || '',
      };
    }
    if (sourcePuzzle.puzzle_type === 'OPEN_ENDED') {
      return {
        ...mappedBase,
        options: ['', ''],
        correctAnswer: sourcePuzzle.open_ended?.correct_answer || sourcePuzzle.correct_answer || '',
      };
    }
    if (sourcePuzzle.puzzle_type === 'PICTURE_COMPARE') {
      return {
        ...mappedBase,
        options: ['', ''],
        correctAnswer: '',
        referenceImage: sourcePuzzle.picture_compare?.reference_image || sourcePuzzle.reference_image,
      };
    }
    if (sourcePuzzle.puzzle_type === 'AR') {
      const metadata = sourcePuzzle.ar?.metadata || {};
      const anchorPosition = metadata.anchor_position as ARPuzzleConfig['anchorPosition'] | undefined;
      return {
        ...mappedBase,
        options: ['', ''],
        correctAnswer: '',
        arConfig: {
          modelId: Number(metadata.model_id || 0),
          modelSlug: '',
          modelName: '',
          previewImageUrl: '',
          sceneAssetUrl: sourcePuzzle.ar?.scene_asset_url || '',
          modelScaleMeters: Number(metadata.model_scale_meters || 1),
          secretCode: String(metadata.secret_code || ''),
          placementMode: 'anchor',
          anchorId: String(metadata.anchor_id || ''),
          anchorLabel: String(metadata.anchor_id || ''),
          anchorPosition: {
            x: Number(anchorPosition?.x || 0),
            y: Number(anchorPosition?.y || 0),
            z: Number(anchorPosition?.z || 0),
          },
        },
      };
    }
    if (sourcePuzzle.puzzle_type === 'COMPASS') {
      return {
        ...mappedBase,
        options: ['', ''],
        correctAnswer: '',
        targetHeadingDegrees: sourcePuzzle.compass?.target_heading_degrees,
      };
    }
    return mappedBase;
  }, []);

  const initializeFromExistingTour = useCallback(
    (tour: Tour) => {
      const locations: TourLocation[] = [...tour.steps]
        .sort((a, b) => a.order - b.order)
        .map((step, index) => ({
          id: `step_${step.id}`,
          serverStepId: step.id,
          latitude: Number(step.latitude),
          longitude: Number(step.longitude),
          title: step.title || '',
          address: '',
          story: step.description || '',
          order: index + 1,
          image: step.image || undefined,
          puzzle: mapPuzzle(step),
        }));

      const nextData: TourCreationData = {
        sourceTourId: tour.id,
        sourceTourStatus: tour.status,
        title: tour.title || '',
        description: tour.description || '',
        coverImage: tour.cover_image || undefined,
        category: tour.category || '',
        difficulty: tour.difficulty,
        tourType: tour.tour_type,
        estimatedDuration: tour.duration_minutes || 60,
        locations,
        country: tour.country || '',
        countryCode: tour.country_code || '',
        state: tour.city || '',
        stateLatitude: tour.city_latitude,
        stateLongitude: tour.city_longitude,
      };

      setMode('edit');
      setTourData(nextData);
      setOriginalSnapshot(JSON.parse(JSON.stringify(nextData)) as TourCreationData);
      setSelectedLocation(null);
    },
    [mapPuzzle]
  );

  const startCreateMode = useCallback(() => {
    setMode('create');
    setOriginalSnapshot(null);
    setTourData(createEmptyTourData());
    setSelectedLocation(null);
  }, []);

  const resetTourData = useCallback(() => {
    setMode('create');
    setOriginalSnapshot(null);
    setTourData(createEmptyTourData());
    setSelectedLocation(null);
  }, []);

  return (
    <TourCreationContext.Provider
      value={{
        tourData,
        mode,
        originalSnapshot,
        updateTourData,
        updateLocation,
        initializeFromExistingTour,
        startCreateMode,
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
