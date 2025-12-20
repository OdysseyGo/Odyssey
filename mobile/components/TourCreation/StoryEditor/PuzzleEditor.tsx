
import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import StoryInputField from './StoryInputField';
import { Puzzle } from '../TourCreation.types';

interface PuzzleEditorProps {
    puzzle?: Puzzle;
    onChange: (puzzle: Puzzle) => void;
}

export default function PuzzleEditor({ puzzle, onChange }: PuzzleEditorProps) {
    const theme = useColorTheme();
    const color = Colors[theme];

    const handleChange = (field: keyof Puzzle, value: string) => {
        onChange({
            question: puzzle?.question || '',
            answer: puzzle?.answer || '',
            hint: puzzle?.hint || '',
            [field]: value,
        });
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionTitle, { color: color.text }]}>Puzzle Challenge</Text>

            <StoryInputField
                label="Question / Challenge *"
                value={puzzle?.question || ''}
                onChangeText={(text) => handleChange('question', text)}
                placeholder="e.g., What year was the tower built?"
                hint="The question or riddle the user needs to solve at this location."
                multiline
            />

            <StoryInputField
                label="Answer *"
                value={puzzle?.answer || ''}
                onChangeText={(text) => handleChange('answer', text)}
                placeholder="e.g., 1348"
                hint="The correct answer to unlock the next location."
            />

            <StoryInputField
                label="Hint (Optional)"
                value={puzzle?.hint || ''}
                onChangeText={(text) => handleChange('hint', text)}
                placeholder="e.g., Look at the plaque above the door."
                hint="A helpful clue if the user gets stuck."
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        gap: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
});
