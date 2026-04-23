import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { fetchGoogleMapsApiKey } from '@/api/map';
import { formGooglePlacesSelectStyles } from './FormGooglePlacesSelect.styles';
import { useTranslation } from 'react-i18next';

export type GooglePlacesSelectValue = {
  label: string;
  value: string;
  countryCode?: string;
};

type FormGooglePlacesSelectProps = {
  value?: string;
  placeholder: string;
  disabled?: boolean;
  types: '(regions)' | '(cities)';
  countryCode?: string;
  onSelect: (value: GooglePlacesSelectValue) => void;
};

type PlaceSuggestion = {
  placeId: string;
  description: string;
  label: string;
};

type PlaceDetails = {
  countryCode?: string;
  countryName?: string;
  localityName?: string;
  types: string[];
};

const AUTOCOMPLETE_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const COUNTRY_COMPONENT_TYPES = new Set(['country']);
const CITY_COMPONENT_TYPES = new Set(['locality', 'postal_town']);
const MIN_QUERY_LENGTH = 1;

export default function FormGooglePlacesSelect({
  value = '',
  placeholder,
  disabled = false,
  types,
  countryCode,
  onSelect,
}: FormGooglePlacesSelectProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = formGooglePlacesSelectStyles(theme);
  const { t } = useTranslation();
  const [mapsApiKey, setMapsApiKey] = useState('');
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [keyError, setKeyError] = useState('');
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const isSelectingRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchGoogleMapsApiKey()
      .then((key) => {
        if (!key) {
          setKeyError('Google Maps key is not configured.');
          return;
        }
        setMapsApiKey(key);
      })
      .catch((error) => {
        console.warn('[FormGooglePlacesSelect] Failed to load Google Maps key:', error);
        setKeyError('Google Maps key could not be loaded.');
      })
      .finally(() => setIsLoadingKey(false));
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const canSearch = Boolean(
    mapsApiKey && !disabled && isFocused && query.trim().length >= MIN_QUERY_LENGTH
  );

  useEffect(() => {
    if (!canSearch) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          input: query.trim(),
          key: mapsApiKey,
          language: 'en',
          types: types === '(regions)' ? 'country' : '(cities)',
        });

        if (countryCode) {
          params.set('components', `country:${countryCode.toLowerCase()}`);
        }

        const response = await fetch(`${AUTOCOMPLETE_URL}?${params.toString()}`);
        const data = await response.json();
        const predictions = Array.isArray(data.predictions) ? data.predictions : [];

        if (!cancelled) {
          const filteredPredictions = predictions.filter((prediction: any) => {
            const predictionTypes = prediction.types || [];
            if (types === '(regions)') {
              return predictionTypes.includes('country');
            }
            return predictionTypes.some((type: string) => CITY_COMPONENT_TYPES.has(type));
          });

          setSuggestions(
            filteredPredictions.slice(0, 6).map((prediction: any) => ({
              placeId: prediction.place_id,
              description: prediction.description,
              label: prediction.structured_formatting?.main_text || prediction.description,
            }))
          );
        }
      } catch (error) {
        console.warn('[FormGooglePlacesSelect] Places search failed:', error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, countryCode, mapsApiKey, query, types]);

  const fetchPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
    const params = new URLSearchParams({
      place_id: placeId,
      key: mapsApiKey,
      fields: 'address_components,types',
    });
    const response = await fetch(`${DETAILS_URL}?${params.toString()}`);
    const data = await response.json();
    const components = data.result?.address_components || [];
    const country = components.find((component: any) => component.types?.includes('country'));
    const locality = components.find((component: any) =>
      component.types?.some((type: string) => CITY_COMPONENT_TYPES.has(type))
    );

    return {
      countryCode: country?.short_name,
      countryName: country?.long_name,
      localityName: locality?.long_name,
      types: data.result?.types || [],
    };
  };

  const handleSelect = async (suggestion: PlaceSuggestion) => {
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;
    setSelectionError('');

    const rejectSelection = (message: string) => {
      setSelectionError(message);
      setIsFocused(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      isSelectingRef.current = false;
    };

    let placeDetails: PlaceDetails | undefined;
    try {
      placeDetails = await fetchPlaceDetails(suggestion.placeId);
    } catch (error) {
      console.warn('[FormGooglePlacesSelect] Place details failed:', error);
    }

    if (types === '(regions)') {
      if (!placeDetails?.types.some((type) => COUNTRY_COMPONENT_TYPES.has(type))) {
        rejectSelection(
          t('creation.details.countryOnlyError', {
            defaultValue: 'Please select a country.',
          })
        );
        return;
      }
    }

    if (types === '(cities)' && countryCode) {
      const isCity = placeDetails?.types.some((type) => CITY_COMPONENT_TYPES.has(type));
      if (!isCity) {
        rejectSelection(
          t('creation.details.cityOnlyError', {
            defaultValue: 'Please select a city.',
          })
        );
        return;
      }

      if (placeDetails?.countryCode?.toLowerCase() !== countryCode.toLowerCase()) {
        rejectSelection(
          t('creation.details.cityCountryMismatch', {
            defaultValue: 'Selected city is not in the selected country.',
          })
        );
        return;
      }
    }

    setQuery(suggestion.label);
    setSuggestions([]);
    setIsFocused(false);
    onSelect({
      label: suggestion.label,
      value:
        types === '(cities)'
          ? placeDetails?.localityName || suggestion.label
          : placeDetails?.countryName || suggestion.label,
      countryCode: placeDetails?.countryCode,
    });

    isSelectingRef.current = false;
  };

  if (isLoadingKey) {
    return (
      <View style={[styles.loadingWrap, disabled && styles.disabled]}>
        <ActivityIndicator size="small" color={color.primary} />
      </View>
    );
  }

  if (!mapsApiKey) {
    return (
      <View>
        <TextInput
          value={value}
          editable={false}
          placeholder={keyError || placeholder}
          placeholderTextColor={color.subText}
          style={styles.fallbackInput}
        />
        {keyError ? <Text style={styles.errorText}>{keyError}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.textInputContainer}>
        <TextInput
          ref={inputRef}
          value={query}
          editable={!disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!isSelectingRef.current) setIsFocused(false);
            }, 250);
          }}
          onChangeText={(text) => {
            setQuery(text);
            setSelectionError('');
          }}
          placeholder={placeholder}
          placeholderTextColor={color.subText}
          autoCorrect={false}
          style={styles.textInput}
        />
        {isSearching ? <ActivityIndicator size="small" color={color.primary} /> : null}
      </View>

      {isFocused && suggestions.length > 0 ? (
        <View style={styles.listView}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.placeId}
              style={styles.row}
              activeOpacity={0.75}
              delayPressIn={0}
              onPressIn={() => handleSelect(suggestion)}
            >
              <Text style={styles.description} numberOfLines={1}>
                {suggestion.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {selectionError ? <Text style={styles.errorText}>{selectionError}</Text> : null}
    </View>
  );
}
