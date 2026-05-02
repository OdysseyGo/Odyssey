import { View, Image } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useMemo, useState } from 'react';

import getStyles, { getIconName } from './MapMarker.styles';
import { MapMarkerProps } from './MapMarker.config';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';

function MapMarker({
  coordinate,
  iconType,
  circleSize,
  circleColor,
  opacity = 1,
  coverImage,
  onPress,
  selected = false,
}: MapMarkerProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const [imageLoaded, setImageLoaded] = useState(false);

  const iconSize = Math.round(circleSize * 0.6);
  const selectedBorder = selected ? { borderColor: colors.primary, borderWidth: 2.5 } : {};

  if (coverImage) {
    return (
      <Marker
        coordinate={coordinate}
        tracksViewChanges={!imageLoaded}
        anchor={{ x: 0.5, y: 1 }}
        onPress={onPress}
      >
        <View style={[styles.bannerWrapper, { opacity }]}>
          <View style={[styles.banner, selectedBorder]}>
            <Image
              source={{ uri: coverImage }}
              style={styles.bannerImage}
              onLoad={() => setTimeout(() => setImageLoaded(true), 300)}
            />
            <View style={[styles.typeBadge, { backgroundColor: circleColor }]}>
              <MaterialCommunityIcons
                name={getIconName(iconType)}
                size={8}
                color={colors.background}
              />
            </View>
          </View>
          <View style={[styles.pin, { borderTopColor: selected ? colors.primary : circleColor }]} />
        </View>
        <Callout tooltip />
      </Marker>
    );
  }

  return (
    <Marker coordinate={coordinate} tracksViewChanges={false} onPress={onPress}>
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
            selectedBorder,
          ]}
        >
          <MaterialCommunityIcons
            name={getIconName(iconType)}
            size={iconSize}
            color={colors.background}
          />
        </View>
      </View>
      <Callout tooltip />
    </Marker>
  );
}

function arePropsEqual(prev: MapMarkerProps, next: MapMarkerProps) {
  return (
    prev.iconType === next.iconType &&
    prev.circleSize === next.circleSize &&
    prev.circleColor === next.circleColor &&
    prev.opacity === next.opacity &&
    prev.coverImage === next.coverImage &&
    prev.selected === next.selected &&
    prev.coordinate.latitude === next.coordinate.latitude &&
    prev.coordinate.longitude === next.coordinate.longitude
  );
}

export default memo(MapMarker, arePropsEqual);
