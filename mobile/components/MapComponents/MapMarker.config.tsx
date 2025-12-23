import { markerColors } from '@/constants/Colors';

export type IconType = 'story' | 'puzzle' | 'story-puzzle';

export interface MapMarkerProps {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  iconType: IconType;
  circleSize: number;
  circleColor: string;
  opacity?: number;
}

export const exampleMapMarkers: MapMarkerProps[] = [
  {
    id: '1',
    coordinate: {
      latitude: 41.0082,
      longitude: 28.9784,
    },
    title: 'Story Marker',
    iconType: 'story',
    circleSize: 40,
    circleColor: markerColors[0 % markerColors.length],
  },
  {
    id: '2',
    coordinate: {
      latitude: 41.0151,
      longitude: 28.9795,
    },
    title: 'Puzzle Marker',
    iconType: 'puzzle',
    circleSize: 40,
    circleColor: markerColors[1 % markerColors.length],
  },
  {
    id: '3',
    coordinate: {
      latitude: 41.012,
      longitude: 28.989,
    },
    title: 'Story-Puzzle Marker',
    iconType: 'story-puzzle',
    circleSize: 40,
    circleColor: markerColors[2 % markerColors.length],
  },
];
