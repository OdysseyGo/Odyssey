import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { locationItemStyles } from './LocationItem.styles';
import { TourLocation } from '../TourCreation.types';
import { useTranslation } from 'react-i18next';

type LocationItemProps = {
  location: TourLocation;
  isSelected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onReorderUp: () => void;
  onReorderDown: () => void;
  onDelete: () => void;
};

export default function LocationItem({
  location,
  isSelected,
  isFirst,
  isLast,
  onPress,
  onReorderUp,
  onReorderDown,
  onDelete,
}: LocationItemProps) {
  const theme = useColorTheme();
  const styles = locationItemStyles(theme);
  const color = Colors[theme];
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.locationItem, isSelected && styles.locationItemSelected]}
      onPress={onPress}
    >
      <View style={styles.locationOrder}>
        <Text style={styles.locationOrderText}>{location.order}</Text>
      </View>
      <View style={styles.locationInfo}>
        <Text style={[styles.locationTitle, !location.title && styles.locationTitlePlaceholder]}>
          {location.title || t('creation.location.tapToAddDetails')}
        </Text>
        <Text style={styles.locationCoords}>
          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      </View>
      <View style={styles.locationActions}>
        <TouchableOpacity
          style={styles.locationActionButton}
          onPress={onReorderUp}
          disabled={isFirst}
        >
          <Ionicons
            name="chevron-up"
            size={20}
            color={isFirst ? color.foregroundSecondary : color.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.locationActionButton}
          onPress={onReorderDown}
          disabled={isLast}
        >
          <Ionicons
            name="chevron-down"
            size={20}
            color={isLast ? color.foregroundSecondary : color.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.locationActionButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={color.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
