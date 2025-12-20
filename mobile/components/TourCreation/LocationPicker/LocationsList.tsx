import React from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationsListStyles } from './LocationsList.styles';
import { TourLocation } from '../TourCreation.types';
import LocationsHeader from './LocationsHeader';
import LocationItem from './LocationItem';
import EmptyLocations from './EmptyLocations';

type LocationsListProps = {
  locations: TourLocation[];
  selectedLocationId: string | null;
  onLocationPress: (location: TourLocation) => void;
  onReorderLocation: (locationId: string, direction: 'up' | 'down') => void;
  onDeleteLocation: (locationId: string) => void;
};

export default function LocationsList({
  locations,
  selectedLocationId,
  onLocationPress,
  onReorderLocation,
  onDeleteLocation,
}: LocationsListProps) {
  const theme = useColorTheme();
  const styles = locationsListStyles(theme);

  const handleDelete = (locationId: string) => {
    Alert.alert('Delete Location', 'Are you sure you want to delete this location?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDeleteLocation(locationId),
      },
    ]);
  };

  return (
    <View style={styles.locationsList}>
      <LocationsHeader count={locations.length} />
      <ScrollView style={styles.locationsScrollView}>
        {locations.length === 0 ? (
          <EmptyLocations />
        ) : (
          locations.map((location, index) => (
            <LocationItem
              key={location.id}
              location={location}
              isSelected={selectedLocationId === location.id}
              isFirst={index === 0}
              isLast={index === locations.length - 1}
              onPress={() => onLocationPress(location)}
              onReorderUp={() => onReorderLocation(location.id, 'up')}
              onReorderDown={() => onReorderLocation(location.id, 'down')}
              onDelete={() => handleDelete(location.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
