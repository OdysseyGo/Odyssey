import React from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRewardedAd } from './useRewardedAd';
import { useAds } from '@/contexts/AdsContext';

type Props = {
  placement: string;
  label: string;
  onEarned: () => void | Promise<void>;
  disabled?: boolean;
};

export default function RewardedAdButton({ placement, label, onEarned, disabled }: Props) {
  const { isAdFree, isReady } = useAds();
  const { status, show, available } = useRewardedAd(placement);

  if (!isReady || isAdFree || !available) return null;

  const isLoading = status === 'loading' || status === 'idle';
  const isShowing = status === 'showing';

  const handlePress = async () => {
    const earned = await show();
    if (earned) await onEarned();
  };

  return (
    <Pressable
      style={[styles.button, (disabled || isLoading || isShowing) && styles.disabled]}
      onPress={handlePress}
      disabled={disabled || isLoading || isShowing || status !== 'loaded'}
    >
      {isLoading || isShowing ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.content}>
          <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
          <Text style={styles.text}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
