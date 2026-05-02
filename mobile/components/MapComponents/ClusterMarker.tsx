import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { memo } from 'react';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

export interface ClusterMarkerProps {
  id: string;
  coordinate: { latitude: number; longitude: number };
  count: number;
  onPress: () => void;
}

function ClusterMarker({ coordinate, count, onPress, id }: ClusterMarkerProps) {
  const theme = useColorTheme();
  const colors = Colors[theme];

  const size = count >= 10 ? 44 : 36;
  const fontSize = count >= 100 ? 11 : count >= 10 ? 13 : 14;

  return (
    <Marker
      coordinate={coordinate}
      tracksViewChanges={false}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View
        style={[
          styles.outer,
          {
            width: size + 10,
            height: size + 10,
            borderRadius: (size + 10) / 2,
            backgroundColor: colors.primary + '30',
          },
        ]}
      >
        <View
          style={[
            styles.inner,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: colors.primary,
              borderColor: colors.background,
            },
          ]}
        >
          <Text style={[styles.count, { fontSize, color: colors.background }]}>{count}</Text>
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  count: {
    fontWeight: '700',
  },
});

export default memo(ClusterMarker);
