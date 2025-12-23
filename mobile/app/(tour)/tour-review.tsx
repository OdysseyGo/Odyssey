import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { createTour, createTourStep } from '@/api/tours';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTourCreation } from '@/contexts/TourCreationContext';
import { TourReviewStep } from '@/components/TourCreation/steps';
import { StepIndicator, CreationFooter } from '@/components/TourCreation/common';

const STEPS = ['details', 'locations', 'stories', 'review'];

export default function TourReviewScreen() {
  const theme = useColorTheme();
  const color = Colors[theme];
  const { tourData, resetTourData } = useTourCreation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitTour = async () => {
    Alert.alert('Submit Tour', 'Are you ready to submit your tour for review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Submit',
        onPress: async () => {
          setIsSubmitting(true);
          try {
            // 1. Create the Tour
            const tour = await createTour({
              title: tourData.title || 'Untitled Tour',
              description: tourData.description || 'No description provided.',
              tour_type: tourData.tourType,
              category: tourData.category || 'General',
              difficulty: tourData.difficulty,
              duration_minutes: tourData.estimatedDuration,
              city: tourData.city || 'Unknown City',
              status: 'PUBLISHED', // or DRAFT
              is_premium: false,
            });

            console.log('Tour created:', tour.id);

            // 2. Create Steps for each location
            // We use a for...of loop to execute them in order (or Promise.all for parallel)
            // Sequential might be safer to ensure order if backend relies on insertion order,
            // but we are sending 'order' field so Promise.all is faster.
            const createStepPromises = tourData.locations.map((loc, index) =>
              createTourStep(tour.id, {
                title: loc.title || `Stop ${index + 1}`,
                description: loc.story || '',
                latitude: Number(loc.latitude).toFixed(8),
                longitude: Number(loc.longitude).toFixed(8),
                order: loc.order,
                image: loc.image,
                // Include puzzle data if available (for PUZZLE or HYBRID tours)
                puzzle: loc.puzzle
                  ? {
                      puzzle_type: loc.puzzle.puzzle_type,
                      question: loc.puzzle.question,
                      options: loc.puzzle.options,
                      correct_answer: loc.puzzle.correctAnswer,
                      hint: loc.puzzle.hint,
                      xp_reward: loc.puzzle.xp_reward,
                    }
                  : undefined,
              })
            );

            await Promise.all(createStepPromises);

            Alert.alert('Success', 'Your tour has been created!', [
              {
                text: 'OK',
                onPress: () => {
                  resetTourData();
                  // Navigate back to the main screen
                  router.dismissAll();
                },
              },
            ]);
          } catch (error) {
            console.error('Failed to create tour:', error);
            Alert.alert('Error', 'Failed to submit tour. Please try again.');
          } finally {
            setIsSubmitting(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: color.foreground }]}>
      <StepIndicator steps={STEPS} currentStepIndex={3} />
      <TourReviewStep tourData={tourData} />
      <CreationFooter
        buttonText={isSubmitting ? 'Submitting...' : 'Submit Tour'}
        onPress={handleSubmitTour}
        disabled={isSubmitting} // Assuming CreationFooter supports disabled prop, if not we might need to check
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
