import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationPickerStyles } from './LocationPicker.styles';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { TourLocation, createNewLocation } from '../TourCreation.types';
import MapContainer from './MapContainer';
import InstructionBanner from './InstructionBanner';
import LocationsList from './LocationsList';
import LocationSearchBar from './LocationSearchBar';
import { DEFAULT_REGION, SEARCH_BAR_HEIGHT } from './LocationPicker.config';

type LocationPickerProps = {
  locations: TourLocation[];
  onLocationsChange: (locations: TourLocation[]) => void;
  onLocationSelect: (location: TourLocation) => void;
  countryCode?: string;
};

export default function LocationPicker({
  locations,
  onLocationsChange,
  onLocationSelect,
  countryCode,
}: LocationPickerProps) {
  const theme = useColorTheme();
  const styles = locationPickerStyles(theme);
  const color = Colors[theme];
  const mapRef = useRef<MapView>(null);

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      mapRef.current?.animateToRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    })();
  }, []);

  const handleLocationAdd = useCallback(
    (latitude: number, longitude: number, name: string) => {
      const newLocation = createNewLocation(latitude, longitude, locations.length + 1);
      newLocation.title = name;
      onLocationsChange([...locations, newLocation]);
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
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
        onMarkerPress={handleLocationPress}
        initialRegion={DEFAULT_REGION}
      />
      <LocationSearchBar onLocationAdd={handleLocationAdd} countryCode={countryCode} />
      <InstructionBanner topOffset={Spacing.md + SEARCH_BAR_HEIGHT + Spacing.sm} />
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
