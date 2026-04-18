import { View, Text, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useMemo } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { SearchResultItemProps } from './SearchResult.config';
import { searchResultStyles } from './SearchResult.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import { STAR } from '@/constants/Symbols';
import Colors from '@/constants/Colors';

export default function SearchResult({
  id,
  image,
  title,
  author,
  duration,
  rating,
  location,
  creditPrice,
}: SearchResultItemProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => searchResultStyles(theme), [theme]);
  const colors = Colors[theme];

  const handlePress = () => {
    // Dismiss the search modal first, then navigate to tour
    router.dismiss();
    router.push({
      pathname: '/tour/[id]',
      params: { id },
    });
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.7 }]}
    >
      <View>
        <Image source={{ uri: image }} style={styles.image} />
        {creditPrice && creditPrice > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              backgroundColor: '#FFD93D',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <FontAwesome name="lock" size={9} color="#1a1a1a" />
            <Text style={{ color: '#1a1a1a', fontSize: 9, fontWeight: '700' }}>
              {creditPrice} credits
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.author}>by {author}</Text>
        <View style={styles.locationRow}>
          <FontAwesome name="map-marker" size={12} color={colors.subText} />
          <Text style={styles.locationText}>{location}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{duration}</Text>
          <Text style={styles.metaText}>•</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.star}>{STAR}</Text>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
