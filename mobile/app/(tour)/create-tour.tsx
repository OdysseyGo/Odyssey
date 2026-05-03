import CreationMethodSelect from '@/components/TourCreation/CreationMethodSelect';
import { useEffect } from 'react';
import { useTourCreation } from '@/contexts/TourCreationContext';

export default function CreateTourScreen() {
  const { startCreateMode } = useTourCreation();

  useEffect(() => {
    startCreateMode();
  }, [startCreateMode]);

  return <CreationMethodSelect />;
}
