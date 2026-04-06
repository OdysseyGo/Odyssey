import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TourDisplayComp from './TourDisplayComp';
import type { TourDisplayProps } from './TourDisplayComp.config';
import { useColorTheme } from '@/utils/useColorTheme';
import { tourScrollerCompStyles } from './TourScrollerComp.styles';
import Colors from '@/constants/Colors';

export type TourScrollerProps = {
  title?: string;
  data: TourDisplayProps[];
  accentColor?: string;
};

export default function TourScrollerComp({ title, data, accentColor }: TourScrollerProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = useMemo(() => tourScrollerCompStyles(theme), [theme]);

  const accent = accentColor ?? color.primary;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={[styles.accentBar, { backgroundColor: accent }]} />
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.rightSection}>
            <View style={[styles.countBadge, { backgroundColor: `${accent}15` }]}>
              <Text style={[styles.countText, { color: accent }]}>{data.length}</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
        disableIntervalMomentum={true}
        nestedScrollEnabled={true}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <TourDisplayComp {...item} />}
      />
    </View>
  );
}
