import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { fetchCitySuggestions, fetchCountrySuggestions } from '@/api/locations';
import { useColorTheme } from '@/utils/useColorTheme';

import { formGooglePlacesSelectStyles } from './FormGooglePlacesSelect.styles';

export type GooglePlacesSelectValue = {
  label: string;
  value: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
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
  id: string;
  label: string;
  value: string;
  description: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

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

  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const isSelectingRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const canSearch = Boolean(!disabled && isFocused && query.trim().length >= MIN_QUERY_LENGTH);

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
        const trimmedQuery = query.trim();
        let mapped: PlaceSuggestion[] = [];

        if (types === '(regions)') {
          const countries = await fetchCountrySuggestions(trimmedQuery);
          mapped = countries.slice(0, 10).map((country) => ({
            id: `country:${country.country_code || country.name}`,
            label: country.name,
            value: country.name,
            description: country.name,
            countryCode: country.country_code || '',
            latitude: undefined,
            longitude: undefined,
          }));
          const hasExactMatch = mapped.some(
            (item) => item.value.toLowerCase() === trimmedQuery.toLowerCase()
          );
          if (!hasExactMatch) {
            mapped.unshift({
              id: `country:typed:${trimmedQuery}`,
              label: trimmedQuery,
              value: trimmedQuery,
              description: trimmedQuery,
              countryCode: trimmedQuery.length === 2 ? trimmedQuery.toUpperCase() : '',
              latitude: undefined,
              longitude: undefined,
            });
          }
        } else {
          const cities = await fetchCitySuggestions(trimmedQuery, countryCode);
          mapped = cities.slice(0, 10).map((city) => ({
            id: `city:${city.name}:${city.country_code}`,
            label: city.name,
            value: city.name,
            description: city.country_code ? `${city.name}, ${city.country_code}` : city.name,
            countryCode: city.country_code || countryCode || '',
            latitude: city.latitude,
            longitude: city.longitude,
          }));
        }

        if (!cancelled) {
          setSuggestions(mapped.slice(0, 6));
        }
      } catch (error) {
        console.warn('[FormGooglePlacesSelect] Location search failed:', error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, countryCode, query, types]);

  const handleSelect = (suggestion: PlaceSuggestion) => {
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;
    setSelectionError('');

    if (types === '(cities)' && countryCode && suggestion.countryCode) {
      const selectedCode = suggestion.countryCode.toLowerCase();
      const expectedCode = countryCode.toLowerCase();
      if (selectedCode !== expectedCode) {
        setSelectionError(
          t('creation.details.cityCountryMismatch', {
            defaultValue: 'Selected city is not in the selected country.',
          })
        );
        setIsFocused(true);
        setTimeout(() => inputRef.current?.focus(), 0);
        isSelectingRef.current = false;
        return;
      }
    }

    setQuery(suggestion.value);
    setSuggestions([]);
    setIsFocused(false);
    onSelect({
      label: suggestion.label,
      value: suggestion.value,
      countryCode: suggestion.countryCode,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });

    isSelectingRef.current = false;
  };

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
              key={suggestion.id}
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
