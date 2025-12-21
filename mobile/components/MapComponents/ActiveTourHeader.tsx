import React, { useMemo } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import getStyles from './ActiveTourHeader.styles';
import { ActiveTourHeaderProps, defaultConfig } from './ActiveTourHeader.config';

export default function ActiveTourHeader({
  tour,
  currentStepIndex,
  solvedSteps,
  earnedXP,
  onEndTour,
}: ActiveTourHeaderProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const colors = Colors[theme];
  const config = defaultConfig;

  const totalSteps = tour.steps.length;
  const completedSteps = solvedSteps.size;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        {/* Tour Info Section */}
        <View style={styles.tourInfo}>
          <Text style={styles.tourTitle} numberOfLines={1}>
            {tour.title}
          </Text>
          
          <View style={styles.progressContainer}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={14}
              color={colors.subText}
            />
            <Text style={styles.progressText}>
              Step {currentStepIndex + 1} of {totalSteps}
            </Text>
            
            {config.showXPBadge && earnedXP > 0 && (
              <View style={styles.xpBadge}>
                <MaterialCommunityIcons name="star" size={12} color="#000" />
                <Text style={styles.xpText}>{earnedXP} XP</Text>
              </View>
            )}
          </View>

          {config.showProgressBar && (
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${progressPercent}%` }
                  ]} 
                />
              </View>
              
              {config.showStepDots && (
                <View style={styles.stepIndicatorsContainer}>
                  {tour.steps.map((step, index) => {
                    const isCurrent = index === currentStepIndex;
                    const isCompleted = solvedSteps.has(step.id) || index < currentStepIndex;
                    
                    return (
                      <View
                        key={step.id}
                        style={[
                          styles.stepDot,
                          isCompleted && styles.stepDotCompleted,
                          isCurrent && styles.stepDotCurrent,
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* End Tour Button */}
        <Pressable 
          style={styles.endButton} 
          onPress={onEndTour}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={16} color={colors.white} />
          <Text style={styles.endButtonText}>End</Text>
        </Pressable>
      </View>
    </View>
  );
}
