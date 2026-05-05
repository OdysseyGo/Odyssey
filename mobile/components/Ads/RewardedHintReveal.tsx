import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRewardedAd } from './useRewardedAd';
import { useAds } from '@/contexts/AdsContext';

type Props = {
  hint: string;
  stepId: string;
};

const PLACEMENT_KEY = 'rewarded_hint_reveal';

export default function RewardedHintReveal({ hint, stepId }: Props) {
  const { t } = useTranslation();
  const { isReady, user } = useAds();
  const { status, show, available } = useRewardedAd(PLACEMENT_KEY);
  const [revealed, setRevealed] = useState(false);
  const bypassAdGate = !!user?.is_review_account;

  useEffect(() => {
    setRevealed(false);
  }, [stepId]);

  if (!hint) return null;
  const canUseRewardedGate = isReady && available;
  if (revealed || bypassAdGate || !canUseRewardedGate) {
    return (
      <View style={styles.hintBox}>
        <MaterialCommunityIcons name="lightbulb-on" size={18} color="#B45309" />
        <Text style={styles.hintText}>{hint}</Text>
      </View>
    );
  }

  const isBusy = status === 'loading' || status === 'idle' || status === 'showing';

  const handlePress = async () => {
    const earned = await show();
    if (earned) setRevealed(true);
  };

  return (
    <Pressable
      style={[styles.button, isBusy && styles.disabled]}
      onPress={handlePress}
      disabled={isBusy || status !== 'loaded'}
    >
      {isBusy ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.content}>
          <MaterialCommunityIcons name="lightbulb-outline" size={18} color="#fff" />
          <Text style={styles.text}>
            {t('puzzle.watchAdForHint', { defaultValue: 'Watch ad to reveal hint' })}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#B45309',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  disabled: { opacity: 0.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: '#fff', fontWeight: '600', fontSize: 14 },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  hintText: {
    flex: 1,
    color: '#78350F',
    fontSize: 14,
    lineHeight: 20,
  },
});
