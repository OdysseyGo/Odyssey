import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

type CompassDialProps = {
  heading: number | null;
  size?: number;
  showTarget?: boolean;
  targetHeadingDegrees?: number;
  toleranceDegrees?: number;
};

const normalizeHeading = (angle: number) => ((angle % 360) + 360) % 360;

const polarToCartesian = (cx: number, cy: number, radius: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
};

const sectorPath = (
  cx: number,
  cy: number,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number
) => {
  const start = polarToCartesian(cx, cy, radius, startAngleDeg);
  const end = polarToCartesian(cx, cy, radius, endAngleDeg);
  const sweep = endAngleDeg - startAngleDeg;
  const largeArcFlag = Math.abs(sweep) > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
};

const headingToCardinal = (heading: number | null) => {
  if (heading === null) return '--';
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % labels.length;
  return labels[index];
};

const shortestAngleDelta = (from: number, to: number) => {
  const wrapped = ((to - from + 540) % 360) - 180;
  return wrapped;
};

export default function CompassDial({
  heading,
  size = 280,
  showTarget = false,
  targetHeadingDegrees = 0,
  toleranceDegrees = 5,
}: CompassDialProps) {
  const { t } = useTranslation();
  const animatedHeading = useSharedValue(0);

  useEffect(() => {
    if (heading === null) {
      return;
    }

    const target = normalizeHeading(heading);
    const currentNormalized = normalizeHeading(animatedHeading.value);
    const delta = shortestAngleDelta(currentNormalized, target);
    const next = animatedHeading.value + delta;

    animatedHeading.value = withTiming(next, {
      duration: 140,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedHeading, heading]);

  const dialRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${-animatedHeading.value}deg` }],
  }));

  const dial = useMemo(() => {
    const center = size / 2;
    const radius = size / 2 - 4;
    const normalizedTarget = normalizeHeading(targetHeadingDegrees);
    const normalizedHeading = heading === null ? null : normalizeHeading(heading);
    const innerRing = radius - 18;
    const majorTickInner = radius - 16;
    const minorTickInner = radius - 10;

    const toleranceStart = normalizedTarget - toleranceDegrees;
    const toleranceEnd = normalizedTarget + toleranceDegrees;
    const adjustedEnd = toleranceEnd < toleranceStart ? toleranceEnd + 360 : toleranceEnd;
    const toleranceSector = sectorPath(center, center, innerRing, toleranceStart, adjustedEnd);

    const targetEdge = polarToCartesian(center, center, innerRing, normalizedTarget);
    const targetInnerEdge = polarToCartesian(center, center, 20, normalizedTarget);

    const ticks = Array.from({ length: 36 }, (_, index) => {
      const angle = index * 10;
      const major = angle % 30 === 0;
      const outer = polarToCartesian(center, center, radius - 4, angle);
      const inner = polarToCartesian(
        center,
        center,
        major ? majorTickInner : minorTickInner,
        angle
      );
      return { angle, major, outer, inner };
    });

    const labels = [
      { value: 'N', angle: 0, color: '#ff4d4f' },
      { value: 'E', angle: 90, color: '#f4f4f5' },
      { value: 'S', angle: 180, color: '#f4f4f5' },
      { value: 'W', angle: 270, color: '#f4f4f5' },
    ].map((label) => ({
      ...label,
      position: polarToCartesian(center, center, radius - 32, label.angle),
    }));

    return {
      center,
      radius,
      innerRing,
      toleranceSector,
      targetEdge,
      targetInnerEdge,
      ticks,
      labels,
      normalizedHeading,
    };
  }, [heading, size, targetHeadingDegrees, toleranceDegrees]);

  return (
    <View style={styles.container}>
      <View style={[styles.dialFrame, { width: size, height: size, borderRadius: size / 2 }]}>
        <Animated.View style={[styles.rotatingLayer, dialRotationStyle]}>
          <Svg width={size} height={size}>
            <Circle
              cx={dial.center}
              cy={dial.center}
              r={dial.radius}
              fill="#0f1115"
              stroke="#2e3138"
              strokeWidth={2}
            />
            <Circle
              cx={dial.center}
              cy={dial.center}
              r={dial.innerRing}
              fill="none"
              stroke="#1f232b"
              strokeWidth={2}
            />

            {dial.ticks.map((tick) => (
              <Line
                key={tick.angle}
                x1={tick.outer.x}
                y1={tick.outer.y}
                x2={tick.inner.x}
                y2={tick.inner.y}
                stroke={tick.major ? '#8d94a2' : '#4a515f'}
                strokeWidth={tick.major ? 2.2 : 1.4}
                strokeLinecap="round"
              />
            ))}

            {dial.labels.map((label) => (
              <SvgText
                key={label.value}
                x={label.position.x}
                y={label.position.y + 6}
                fontSize={20}
                fontWeight="700"
                fill={label.color}
                textAnchor="middle"
              >
                {label.value}
              </SvgText>
            ))}

            {showTarget ? (
              <>
                <Path d={dial.toleranceSector} fill="rgba(34, 197, 94, 0.34)" />
                <Line
                  x1={dial.targetInnerEdge.x}
                  y1={dial.targetInnerEdge.y}
                  x2={dial.targetEdge.x}
                  y2={dial.targetEdge.y}
                  stroke="#16a34a"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
              </>
            ) : null}
          </Svg>
        </Animated.View>

        <View style={[styles.pointer, { top: 12, marginLeft: -9 }]}>
          <View style={styles.pointerTriangle} />
        </View>
        <View style={styles.centerDot} />
      </View>

      <View style={styles.readout}>
        <Text style={styles.readoutPrimary}>
          {dial.normalizedHeading === null
            ? t('compass.calibrating')
            : `${Math.round(dial.normalizedHeading)}°`}
        </Text>
        <Text style={styles.readoutSecondary}>{headingToCardinal(dial.normalizedHeading)}</Text>
      </View>

      {showTarget ? (
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: 'rgba(34, 197, 94, 0.34)' }]} />
            <Text style={styles.legendText}>{t('compass.legend.acceptableWindow')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#16a34a' }]} />
            <Text style={styles.legendText}>{t('compass.legend.exactHeading')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: '#f5f5f5' }]} />
            <Text style={styles.legendText}>{t('compass.legend.pointerDirection')}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    alignSelf: 'center',
    marginVertical: 12,
  },
  dialFrame: {
    backgroundColor: '#090a0d',
    borderWidth: 2,
    borderColor: '#2f333c',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  rotatingLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  pointer: {
    position: 'absolute',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  centerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#f4f4f5',
    borderWidth: 2,
    borderColor: '#111318',
  },
  readout: {
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readoutPrimary: {
    fontSize: 30,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  readoutSecondary: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 1.4,
  },
  legendContainer: {
    marginTop: 10,
    width: '100%',
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legendText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
});
