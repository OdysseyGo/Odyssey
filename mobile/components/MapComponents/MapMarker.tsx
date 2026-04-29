import { View } from 'react-native';
import { Marker } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo } from 'react';

import getStyles, { getIconName } from './MapMarker.styles';
import { MapMarkerProps } from './MapMarker.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

function MapMarker({
  coordinate,
  title,
  iconType,
  circleSize,
  circleColor,
  opacity = 1,
}: MapMarkerProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const iconSize = Math.round(circleSize * 0.6);

  return (
    <Marker coordinate={coordinate} title={title} tracksViewChanges={false}>
      <View style={[styles.container, { opacity }]}>
        <View
          style={[
            styles.circle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              backgroundColor: circleColor,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={getIconName(iconType)}
            size={iconSize}
            color={Colors[theme].background}
          />
        </View>
      </View>
    </Marker>
  );
}

function arePropsEqual(prev: MapMarkerProps, next: MapMarkerProps) {
  return (
    prev.title === next.title &&
    prev.iconType === next.iconType &&
    prev.circleSize === next.circleSize &&
    prev.circleColor === next.circleColor &&
    prev.opacity === next.opacity &&
    prev.coordinate.latitude === next.coordinate.latitude &&
    prev.coordinate.longitude === next.coordinate.longitude
  );
}

export default memo(MapMarker, arePropsEqual);
