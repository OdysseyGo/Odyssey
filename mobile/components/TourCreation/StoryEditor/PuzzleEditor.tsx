import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Accelerometer, Magnetometer } from 'expo-sensors';
import { Puzzle, PuzzleType, PUZZLE_TYPE_OPTIONS, createEmptyPuzzle } from '../TourCreation.types';
import PuzzleQuestion from './PuzzleQuestion';
import PuzzleOptions from './PuzzleOptions';
import PuzzleHint from './PuzzleHint';
import ImageUploadSection from './ImageUploadSection';
import ARPuzzleConfigurator from './ARPuzzleConfigurator';
import { puzzleEditorStyles } from './PuzzleEditor.styles';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { useTranslation } from 'react-i18next';
import CompassDial from '@/components/common/CompassDial';
import {
  headingFromSensors,
  normalizeHeading,
  shortestAngleDelta,
  smoothHeading,
} from '@/utils/compass';

const COMPASS_CREATION_TOLERANCE_DEGREES = 10;
const COMPASS_HEADING_OFFSET_DEGREES = 0;
const COMPASS_SENSOR_UPDATE_MS = 50;
const COMPASS_HEADING_SMOOTHING_ALPHA_SLOW = 0.16;
const COMPASS_HEADING_SMOOTHING_ALPHA_MEDIUM = 0.3;
const COMPASS_HEADING_SMOOTHING_ALPHA_FAST = 0.45;
const COMPASS_HEADING_SMOOTHING_MEDIUM_DELTA_DEGREES = 5;
const COMPASS_HEADING_SMOOTHING_FAST_DELTA_DEGREES = 12;
const COMPASS_HEADING_DEADBAND_DEGREES = 0.35;

interface PuzzleEditorProps {
  puzzle?: Puzzle;
  onChange: (puzzle: Puzzle) => void;
  isRequired?: boolean;
}

export default function PuzzleEditor({ puzzle, onChange, isRequired = false }: PuzzleEditorProps) {
  const theme = useColorTheme();
  const color = Colors[theme];
  const styles = puzzleEditorStyles();
  const { t } = useTranslation();

  const currentPuzzle = puzzle || createEmptyPuzzle();
  const [compassHeading, setCompassHeading] = React.useState<number | null>(null);
  const gravityRef = React.useRef<{ x: number; y: number; z: number } | null>(null);
  const filteredHeadingRef = React.useRef<number | null>(null);
  const isPictureCompare = currentPuzzle.puzzle_type === 'PICTURE_COMPARE';
  const isArChallenge = currentPuzzle.puzzle_type === 'AR';
  const isCompass = currentPuzzle.puzzle_type === 'COMPASS';
  const options = currentPuzzle.options;
  const correctAnswer = currentPuzzle.correctAnswer;

  const handleChange = (field: keyof Puzzle, value: any) => {
    onChange({
      ...currentPuzzle,
      [field]: value,
    });
  };

  const handleOptionChange = (text: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = text;

    // If we're renaming the correct answer, update the correct answer value too
    const oldOptionValue = options[index];
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === oldOptionValue) {
      newCorrectAnswer = text;
    }

    onChange({
      ...currentPuzzle,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    });
  };

  const handleAddOption = () => {
    handleChange('options', [...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    const optionToRemove = options[index];
    const newOptions = options.filter((_, i) => i !== index);

    // If we removed the correct answer, reset it
    let newCorrectAnswer = correctAnswer;
    if (correctAnswer === optionToRemove) {
      newCorrectAnswer = '';
    }

    onChange({
      ...currentPuzzle,
      options: newOptions,
      correctAnswer: newCorrectAnswer,
    });
  };

  const handleSelectCorrect = (option: string) => {
    handleChange('correctAnswer', option);
  };

  const handleTypeChange = (nextType: PuzzleType) => {
    if (nextType === 'PICTURE_COMPARE') {
      onChange({
        ...currentPuzzle,
        puzzle_type: nextType,
        options: [],
        // Backend serializer injects this for picture compare as fallback as well.
        correctAnswer: 'PICTURE_COMPARE',
      });
      return;
    }

    if (nextType === 'AR') {
      onChange({
        ...currentPuzzle,
        puzzle_type: nextType,
        options: [],
        correctAnswer: '',
      });
      return;
    }

    if (nextType === 'COMPASS') {
      onChange({
        ...currentPuzzle,
        puzzle_type: nextType,
        options: [],
        correctAnswer: '',
        targetHeadingDegrees: 0,
      });
      return;
    }

    onChange({
      ...currentPuzzle,
      puzzle_type: nextType,
      options: currentPuzzle.options.length > 0 ? currentPuzzle.options : ['', ''],
      correctAnswer:
        currentPuzzle.correctAnswer === 'PICTURE_COMPARE' ? '' : currentPuzzle.correctAnswer,
    });
  };

  React.useEffect(() => {
    if (!isCompass) {
      setCompassHeading(null);
      filteredHeadingRef.current = null;
      return;
    }

    Magnetometer.setUpdateInterval(COMPASS_SENSOR_UPDATE_MS);
    Accelerometer.setUpdateInterval(COMPASS_SENSOR_UPDATE_MS);

    const accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      gravityRef.current = { x, y, z };
    });

    const subscription = Magnetometer.addListener(({ x, y, z }) => {
      const rawHeading = headingFromSensors(
        { x, y, z },
        gravityRef.current,
        COMPASS_HEADING_OFFSET_DEGREES
      );
      const nextHeading =
        filteredHeadingRef.current === null
          ? rawHeading
          : (() => {
              const turnDelta = Math.abs(
                shortestAngleDelta(filteredHeadingRef.current as number, rawHeading)
              );
              const alpha =
                turnDelta > COMPASS_HEADING_SMOOTHING_FAST_DELTA_DEGREES
                  ? COMPASS_HEADING_SMOOTHING_ALPHA_FAST
                  : turnDelta > COMPASS_HEADING_SMOOTHING_MEDIUM_DELTA_DEGREES
                    ? COMPASS_HEADING_SMOOTHING_ALPHA_MEDIUM
                    : COMPASS_HEADING_SMOOTHING_ALPHA_SLOW;
              return smoothHeading(
                filteredHeadingRef.current as number,
                rawHeading,
                alpha,
                COMPASS_HEADING_DEADBAND_DEGREES
              );
            })();
      filteredHeadingRef.current = nextHeading;
      setCompassHeading(nextHeading);
    });

    return () => {
      subscription.remove();
      accelerometerSubscription.remove();
    };
  }, [isCompass]);

  return (
    <View style={styles.container}>
      {/* Puzzle Type Selector */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: color.text }]}>{t('creation.puzzle.type')} *</Text>
        <View style={styles.typeContainer}>
          {PUZZLE_TYPE_OPTIONS.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeButton,
                { borderColor: color.borderLight },
                currentPuzzle.puzzle_type === type.value && {
                  backgroundColor: color.primary,
                  borderColor: color.primary,
                },
              ]}
              onPress={() => handleTypeChange(type.value as PuzzleType)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  { color: currentPuzzle.puzzle_type === type.value ? color.white : color.text },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <PuzzleQuestion
        question={currentPuzzle.question}
        onChange={(text) => handleChange('question', text)}
        isRequired={isRequired}
      />

      {isPictureCompare ? (
        <ImageUploadSection
          image={currentPuzzle.referenceImage}
          onImageChange={(value) => handleChange('referenceImage', value)}
          label="Pick your target image"
          required
          useReferenceImageUI
          infoMessage={[
            'Pick something that is not temporary.',
            'Appropriate.',
            "Has good lighting and doesn't depend much on the time of day.",
          ].join('\n')}
        />
      ) : isArChallenge ? (
        <ARPuzzleConfigurator
          value={currentPuzzle.arConfig}
          onChange={(config) => handleChange('arConfig', config)}
        />
      ) : isCompass ? (
        <View>
          <View style={styles.section}>
            <Text style={[styles.label, { color: color.text }]}>Target Heading (0-359) *</Text>
            <TextInput
              style={[styles.xpInput, { color: color.text, borderColor: color.borderLight }]}
              value={String(currentPuzzle.targetHeadingDegrees ?? 0)}
              onChangeText={(text) => {
                const num = parseInt(text, 10);
                if (!isNaN(num)) {
                  handleChange('targetHeadingDegrees', normalizeHeading(num));
                } else if (text === '') {
                  handleChange('targetHeadingDegrees', 0);
                }
              }}
              keyboardType="number-pad"
              placeholder="238"
              placeholderTextColor={color.placeholder}
            />
          </View>
          <CompassDial
            heading={compassHeading}
            showTarget
            targetHeadingDegrees={currentPuzzle.targetHeadingDegrees ?? 0}
            toleranceDegrees={COMPASS_CREATION_TOLERANCE_DEGREES}
          />
        </View>
      ) : (
        <PuzzleOptions
          options={options}
          correctAnswer={correctAnswer}
          onOptionChange={handleOptionChange}
          onRemoveOption={handleRemoveOption}
          onAddOption={handleAddOption}
          onSelectCorrect={handleSelectCorrect}
          isRequired={isRequired}
        />
      )}

      <PuzzleHint hint={currentPuzzle.hint} onChange={(text) => handleChange('hint', text)} />
    </View>
  );
}
