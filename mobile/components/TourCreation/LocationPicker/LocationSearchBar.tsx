import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useTranslation } from 'react-i18next';
import { fetchGoogleMapsApiKey } from '@/api/map';

type LocationSearchBarProps = {
  onLocationAdd: (latitude: number, longitude: number, name: string) => void;
};

export default function LocationSearchBar({ onLocationAdd }: LocationSearchBarProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { t } = useTranslation();
  const ref = useRef<any>(null);
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    fetchGoogleMapsApiKey()
      .then(setMapsApiKey)
      .catch(() => {});

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder={t('creation.location.searchPlaceholder')}
        fetchDetails
        onPress={(data, details) => {
          if (!details) return;
          const { lat, lng } = details.geometry.location;
          const name = data.structured_formatting.main_text;
          onLocationAdd(lat, lng, name);
          ref.current?.clear();
        }}
        query={{
          key: mapsApiKey,
          language: 'en',
          types: 'geocode|establishment',
          ...(userLocation && {
            location: `${userLocation.lat},${userLocation.lng}`,
            radius: 50000, // 50km bias radius — results outside still appear
          }),
        }}
        styles={{
          container: {
            flex: 0,
          },
          textInputContainer: {
            backgroundColor: color.foreground,
            borderRadius: Spacing.borderRadius,
            paddingHorizontal: Spacing.sm,
            shadowColor: color.textShadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          },
          textInput: {
            color: color.text,
            backgroundColor: color.foreground,
            fontSize: 14,
            height: 44,
          },
          listView: {
            backgroundColor: color.foreground,
            borderRadius: Spacing.borderRadius,
            marginTop: Spacing.xs,
            elevation: 4,
            shadowColor: color.textShadowColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
          },
          row: {
            backgroundColor: color.foreground,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm + 2,
          },
          description: {
            color: color.text,
            fontSize: 13,
          },
          poweredContainer: {
            display: 'none',
          },
        }}
        textInputProps={{
          placeholderTextColor: color.placeholder,
          autoCorrect: false,
        }}
        enablePoweredByContainer={false}
        keepResultsAfterBlur={false}
        keyboardShouldPersistTaps="handled"
        onFail={(error) => console.error('[LocationSearchBar] API error:', error)}
        onNotFound={() => console.warn('[LocationSearchBar] No results found')}
        onTimeout={() => console.warn('[LocationSearchBar] Request timed out')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
  },
});
