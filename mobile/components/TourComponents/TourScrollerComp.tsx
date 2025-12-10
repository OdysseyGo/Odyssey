import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import TourDisplayComp from './TourDisplayComp';
import type { TourDisplayProps } from './TourDisplayComp.config';
import { useColorTheme } from '@/utils/useColorTheme';

export type TourScrollerProps = {
  title?: string;
  data: TourDisplayProps[];
};

export default function TourScrollerComp({ title, data }: TourScrollerProps) {
  const theme = useColorTheme();
  const isDark = theme === 'dark';

  return (
    <View style={styles.container}>
      {title ? (
        <Text
          style={[
            styles.title,
            { color: isDark ? '#fff' : '#000' },
          ]}
        >
          {title}
        </Text>
      ) : null}

      <FlatList
        data={data}
        keyExtractor={(_, index) => index.toString()}
        horizontal

        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        decelerationRate={'fast'}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <TourDisplayComp {...item} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 1,
  },
});
