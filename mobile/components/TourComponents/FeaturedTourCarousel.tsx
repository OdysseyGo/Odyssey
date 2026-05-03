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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTranslation } from 'react-i18next';
import { FeaturedTourCarouselProps } from './FeaturedTourCarousel.config';
import { featuredTourCarouselStyles } from './FeaturedTourCarousel.styles';
import { STAR } from '@/constants/Symbols';
import Colors from '@/constants/Colors';
import { useColorTheme } from '@/utils/useColorTheme';
import TourImagePlaceholder from '@/components/common/TourImagePlaceholder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function FeaturedTourCarousel({
  tours,
  autoPlayInterval = 5000,
}: FeaturedTourCarouselProps) {
  const { t } = useTranslation();
  const theme = useColorTheme();
  const styles = useMemo(() => featuredTourCarouselStyles(theme), [theme]);
  const color = Colors[theme];

  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentOffsetXRef = useRef(0);

  const stopSmoothScroll = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const scrollToIndex = useCallback(
    (index: number, duration = 850) => {
      const targetX = index * SCREEN_WIDTH;
      const startX = currentOffsetXRef.current;
      const distance = targetX - startX;

      if (Math.abs(distance) < 1) {
        scrollViewRef.current?.scrollTo({ x: targetX, animated: false });
        return;
      }

      stopSmoothScroll();
      const startTime = Date.now();
      const easeInOut = (t: number) => 0.5 * (1 - Math.cos(Math.PI * t));

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeInOut(progress);
        const nextX = startX + distance * eased;
        scrollViewRef.current?.scrollTo({ x: nextX, animated: false });

        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [stopSmoothScroll]
  );

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
      stopSmoothScroll();
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [tours.length, autoPlayInterval, scrollToIndex, stopSmoothScroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    currentOffsetXRef.current = contentOffsetX;
    const newIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tours.length) {
      setActiveIndex(newIndex);
    }
  };

  const handleScrollBeginDrag = () => {
    stopSmoothScroll();
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
          decelerationRate="normal"
          style={styles.scrollView}
        >
          {tours.map((tour, index) => (
            <View key={tour.id || index} style={styles.slide}>
              <Pressable
                onPress={() => handleTourPress(tour.id || String(index))}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.imageWrapper}>
                  {tour.image ? (
                    <Image source={{ uri: tour.image }} style={styles.image} />
                  ) : (
                    <TourImagePlaceholder style={styles.imagePlaceholder} iconSize={34} />
                  )}
                  <View style={styles.imageOverlay} />

                  {/* Featured badge */}
                  <View style={styles.featuredBadge}>
                    <Ionicons name="flame" size={12} color={color.white} />
                    <Text style={styles.featuredBadgeText}>{t('tour.featured')}</Text>
                  </View>

                  {/* Rating */}
                  <View style={styles.ratingBadge}>
                    <Text style={styles.star}>{STAR}</Text>
                    <Text style={styles.ratingText}>{tour.rating}</Text>
                  </View>

                  {/* Bottom info */}
                  <LinearGradient
                    colors={['transparent', color.overlay]}
                    locations={[0, 1]}
                    style={styles.infoGradient}
                  >
                    <View style={styles.infoContent}>
                      <Text style={styles.title} numberOfLines={2}>
                        {tour.title}
                      </Text>
                      <View style={styles.authorRow}>
                        <Ionicons name="person-circle" size={15} color={color.white} />
                        <Text style={styles.author}>{tour.author}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={12} color={color.white} />
                          <Text style={styles.metaText}>{tour.duration}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="footsteps-outline" size={12} color={color.white} />
                          <Text style={styles.metaText}>{tour.length}</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="chatbubble-outline" size={12} color={color.white} />
                          <Text style={styles.metaText}>{tour.reviewCount}</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
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
