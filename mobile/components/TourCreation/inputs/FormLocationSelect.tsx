import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import Colors from '@/constants/Colors';
import { fetchCountrySuggestions, fetchStateSuggestions } from '@/api/locations';
import { useColorTheme } from '@/utils/useColorTheme';

import { formLocationSelectStyles } from './FormLocationSelect.styles';

export type LocationSelectValue = {
  label: string;
  value: string;
  countryCode?: string;
  latitude?: number;
  longitude?: number;
};

type FormLocationSelectProps = {
  value?: string;
  placeholder: string;
  disabled?: boolean;
  types: '(regions)' | '(states)';
  countryCode?: string;
  countryName?: string;
  onSelect: (value: LocationSelectValue) => void;
  onClearSelection?: () => void;
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

export default function FormLocationSelect({
  value = '',
  placeholder,
  disabled = false,
  types,
  countryCode,
  countryName,
  onSelect,
  onClearSelection,
}: FormLocationSelectProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = formLocationSelectStyles(theme);
  const { t, i18n } = useTranslation();

  const isEffectivelyDisabled = disabled;
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

  const hasMinQuery = query.trim().length >= MIN_QUERY_LENGTH;
  const canSearch = Boolean(!isEffectivelyDisabled && isFocused && hasMinQuery);

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
          const countries = await fetchCountrySuggestions(trimmedQuery, i18n.language);
          mapped = countries.slice(0, 10).map((country) => ({
            id: `country:${country.country_code || country.name}`,
            label: country.name,
            value: country.name,
            description: country.name,
            countryCode: country.country_code || '',
            latitude: undefined,
            longitude: undefined,
          }));
        } else {
          const states = await fetchStateSuggestions(
            trimmedQuery,
            countryCode,
            countryName,
            i18n.language
          );
          mapped = states.slice(0, 10).map((state) => ({
            id: `state:${state.state_code || state.name}:${state.country_code}`,
            label: state.name,
            value: state.name,
            description:
              state.country_name && state.country_name !== state.country_code
                ? `${state.name}, ${state.country_name}`
                : state.country_code
                  ? `${state.name}, ${state.country_code}`
                  : state.name,
            countryCode: state.country_code || countryCode || '',
            latitude: state.latitude,
            longitude: state.longitude,
          }));
        }

        if (!cancelled) {
          // Keep exact matches visible so users can explicitly tap-select them.
          setSuggestions(mapped.slice(0, 6));
        }
      } catch (error) {
        console.warn('[FormLocationSelect] Location search failed:', error);
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canSearch, countryCode, countryName, i18n.language, query, types]);

  const handleSelect = (suggestion: PlaceSuggestion) => {
    if (isSelectingRef.current) return;
    isSelectingRef.current = true;
    setSelectionError('');

    if (types === '(states)' && countryCode && suggestion.countryCode) {
      const selectedCode = suggestion.countryCode.toLowerCase();
      const expectedCode = countryCode.toLowerCase();
      if (selectedCode !== expectedCode) {
        setSelectionError(
          t('creation.details.stateCountryMismatch', {
            defaultValue: 'Selected state is not in the selected country.',
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
    <View style={[styles.container, isEffectivelyDisabled && styles.disabled]}>
      <View style={styles.textInputContainer}>
        <TextInput
          ref={inputRef}
          value={query}
          editable={!isEffectivelyDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => {
              if (!isSelectingRef.current) {
                setIsFocused(false);
                // Enforce dropdown-only selection: free-typed text is discarded.
                if (query.trim() !== value.trim()) {
                  setQuery(value.trim() ? value : '');
                }
              }
            }, 250);
          }}
          onChangeText={(text) => {
            const trimmedText = text.trim();
            const trimmedValue = value.trim();
            if (trimmedValue && trimmedText !== trimmedValue) {
              onClearSelection?.();
            }
            setQuery(text);
            setSelectionError('');
            setIsFocused(true);
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
              onPress={() => handleSelect(suggestion)}
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
