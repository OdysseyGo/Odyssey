import React, { useRef } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import { locationsListStyles } from './LocationsList.styles';
import { TourLocation } from '../TourCreation.types';
import LocationsHeader from './LocationsHeader';
import LocationItem from './LocationItem';
import EmptyLocations from './EmptyLocations';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const deleteAlertOpenRef = useRef(false);

  const handleDelete = (locationId: string) => {
    if (deleteAlertOpenRef.current) {
      return;
    }

    deleteAlertOpenRef.current = true;
    Alert.alert(
      t('creation.location.deleteTitle'),
      t('creation.location.deleteMessage'),
      [
        {
          text: t('creation.location.cancel'),
          style: 'cancel',
          onPress: () => {
            deleteAlertOpenRef.current = false;
          },
        },
        {
          text: t('creation.location.delete'),
          style: 'destructive',
          onPress: () => {
            deleteAlertOpenRef.current = false;
            onDeleteLocation(locationId);
          },
        },
      ],
      {
        onDismiss: () => {
          deleteAlertOpenRef.current = false;
        },
      }
    );
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
