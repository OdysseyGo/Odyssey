import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import TourDisplayComp from './TourDisplayComp';
import type { TourDisplayProps } from './TourDisplayComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourScrollerCompStyles } from './TourScrollerComp.styles';
import { useMemo } from 'react';

export type TourScrollerProps = {
  title?: string;
  data: TourDisplayProps[];
};

export default function TourScrollerComp({ title, data }: TourScrollerProps) {
  const theme = useColorTheme();

  const styles = useMemo(() => tourScrollerCompStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.headerTitle}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <FlatList
        data={data}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        decelerationRate={'fast'}
        disableIntervalMomentum={true}
        nestedScrollEnabled={true}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <TourDisplayComp {...item} />}
      />
    </View>
  );
}
