import React, { RefObject } from 'react';
import { View } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { mapContainerStyles } from './MapContainer.styles';
import { TourLocation } from '../TourCreation.types';

type MapContainerProps = {
  mapRef: RefObject<MapView | null>;
  locations: TourLocation[];
  selectedLocationId: string | null;
  onMapPress: (event: MapPressEvent) => void;
  onMarkerPress: (location: TourLocation) => void;
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
};

export default function MapContainer({
  mapRef,
  locations,
  selectedLocationId,
  onMapPress,
  onMarkerPress,
  initialRegion,
}: MapContainerProps) {
  const theme = useColorTheme();
  const styles = mapContainerStyles(theme);
  const color = Colors[theme];

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
        onPress={onMapPress}
        showsUserLocation
        showsMyLocationButton
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.title || `Stop ${location.order}`}
            description={location.address}
            pinColor={selectedLocationId === location.id ? color.primary : undefined}
            onPress={() => onMarkerPress(location)}
          />
        ))}
      </MapView>
    </View>
  );
}
