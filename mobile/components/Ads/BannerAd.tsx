import React from 'react';
import { View } from 'react-native';
import { BannerAd as RNBannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useAds } from '@/contexts/AdsContext';
import { resolveAdUnitId } from './adUnitIds';

type Props = {
  placement: string;
  size?: BannerAdSize;
};

export default function BannerAd({ placement, size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }: Props) {
  const { isAdFree, isReady, getPlacement } = useAds();
  if (!isReady || isAdFree) return null;

  const adPlacement = getPlacement(placement);
  if (!adPlacement || adPlacement.ad_format !== 'BANNER') return null;

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <RNBannerAd
        unitId={resolveAdUnitId(adPlacement)}
        size={size}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
