import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FeaturedTourCarouselProps } from './FeaturedTourCarousel.config';
import { featuredTourCarouselStyles } from './FeaturedTourCarousel.styles';
import { STAR } from '@/constants/Symbols';
import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FeaturedTourCarousel({
  tours,
  autoPlayInterval = 5000,
}: FeaturedTourCarouselProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => featuredTourCarouselStyles(theme), [theme]);
  const color = Colors[theme];

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
  }, []);

  useEffect(() => {
    if (tours.length <= 1) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setActiveIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % tours.length;
          scrollToIndex(nextIndex);
          return nextIndex;
        });
      }, autoPlayInterval);
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [tours.length, autoPlayInterval, scrollToIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tours.length) {
      setActiveIndex(newIndex);
    }
  };

  const handleScrollBeginDrag = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const handleScrollEndDrag = () => {
    if (tours.length <= 1) return;

    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % tours.length;
        scrollToIndex(nextIndex);
        return nextIndex;
      });
    }, autoPlayInterval);
  };

  const handleTourPress = (tourId: string) => {
    router.push({
      pathname: '/tour/[id]',
      params: { id: tourId },
    });
  };

  if (!tours || tours.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {tours.map((tour, index) => (
            <View key={tour.id || index} style={styles.slide}>
              <Pressable
                onPress={() => handleTourPress(tour.id || String(index))}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: tour.image }} style={styles.image} />

                  <View style={styles.imageOverlay} />

                  <View style={styles.featuredBadge}>
                    <Ionicons name="flame" size={14} color={color.white} />
                    <Text style={styles.featuredBadgeText}>Featured</Text>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Text style={styles.star}>{STAR}</Text>
                    <Text style={styles.ratingText}>{tour.rating}</Text>
                  </View>

                  <View style={styles.infoContainer}>
                    <View style={styles.infoGradient} />
                    <View style={styles.infoContent}>
                      <Text style={styles.title} numberOfLines={2}>
                        {tour.title}
                      </Text>
                      <View style={styles.authorRow}>
                        <Ionicons name="person-circle" size={16} color="rgba(255,255,255,0.8)" />
                        <Text style={styles.author}>{tour.author}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={14} color={color.white} />
                          <Text style={styles.metaText}>{tour.duration}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="walk-outline" size={14} color={color.white} />
                          <Text style={styles.metaText}>{tour.length}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="chatbubbles-outline" size={14} color={color.white} />
                          <Text style={styles.metaText}>{tour.reviewCount}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      {tours.length > 1 && (
        <View style={styles.pagination}>
          {tours.map((_, index) => (
            <Pressable
              key={index}
              onPress={() => {
                setActiveIndex(index);
                scrollToIndex(index);
              }}
            >
              <View style={index === activeIndex ? styles.dotActive : styles.dot} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
