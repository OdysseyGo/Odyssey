import React, { useState, useRef, useCallback } from 'react';
import { View } from 'react-native';
import MapView, { MapPressEvent, Region } from 'react-native-maps';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationPickerStyles } from './LocationPicker.styles';
import Colors from '@/constants/Colors';
import { TourLocation, createNewLocation } from '../TourCreation.types';
import MapContainer from './MapContainer';
import InstructionBanner from './InstructionBanner';
import LocationsList from './LocationsList';

type LocationPickerProps = {
  locations: TourLocation[];
  onLocationsChange: (locations: TourLocation[]) => void;
  onLocationSelect: (location: TourLocation) => void;
};

const DEFAULT_REGION: Region = {
  latitude: 41.0082,
  longitude: 28.9784,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function LocationPicker({
  locations,
  onLocationsChange,
  onLocationSelect,
}: LocationPickerProps) {
  const theme = useColorTheme();
  const styles = locationPickerStyles(theme);
  const color = Colors[theme];
  const mapRef = useRef<MapView>(null);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      const newLocation = createNewLocation(latitude, longitude, locations.length + 1);
      onLocationsChange([...locations, newLocation]);
    },
    [locations, onLocationsChange]
  );

  const handleLocationPress = useCallback(
    (location: TourLocation) => {
      setSelectedLocationId(location.id);
      onLocationSelect(location);

      // Center map on selected location
      mapRef.current?.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    },
    [onLocationSelect]
  );

  const handleDeleteLocation = useCallback(
    (locationId: string) => {
      const updatedLocations = locations
        .filter((loc) => loc.id !== locationId)
        .map((loc, index) => ({ ...loc, order: index + 1 }));
      onLocationsChange(updatedLocations);
      if (selectedLocationId === locationId) {
        setSelectedLocationId(null);
      }
    },
    [locations, onLocationsChange, selectedLocationId]
  );

  const handleReorderLocation = useCallback(
    (locationId: string, direction: 'up' | 'down') => {
      const index = locations.findIndex((loc) => loc.id === locationId);
      if (
        (direction === 'up' && index === 0) ||
        (direction === 'down' && index === locations.length - 1)
      ) {
        return;
      }

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const updatedLocations = [...locations];
      const [movedLocation] = updatedLocations.splice(index, 1);
      updatedLocations.splice(newIndex, 0, movedLocation);

      // Update order numbers
      const reorderedLocations = updatedLocations.map((loc, idx) => ({
        ...loc,
        order: idx + 1,
      }));

      onLocationsChange(reorderedLocations);
    },
    [locations, onLocationsChange]
  );

  return (
    <View style={styles.container}>
      <MapContainer
        mapRef={mapRef}
        locations={locations}
        selectedLocationId={selectedLocationId}
        onMapPress={handleMapPress}
        onMarkerPress={handleLocationPress}
        initialRegion={DEFAULT_REGION}
      />
      <InstructionBanner />
      <LocationsList
        locations={locations}
        selectedLocationId={selectedLocationId}
        onLocationPress={handleLocationPress}
        onReorderLocation={handleReorderLocation}
        onDeleteLocation={handleDeleteLocation}
      />
    </View>
  );
}
