import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useMemo, useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { getMe, getUserFollowings } from '@/api/users';
import { TourDetailAuthorProps } from './TourDetailAuthor.config';
import { tourDetailAuthorStyles } from './TourDetailAuthor.styles';
import { useTranslation } from 'react-i18next';

export default function TourDetailAuthor({ authorId, authorAvatar, authorName }: TourDetailAuthorProps) {
  const theme = useColorTheme();
  const styles = useMemo(() => tourDetailAuthorStyles(theme), [theme]);
  const colors = Colors[theme];
  const { t } = useTranslation();
  const router = useRouter();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!authorId) return;
      (async () => {
        try {
          const me = await getMe();
          if (me.id === authorId) { setIsSelf(true); return; }
          const followings = await getUserFollowings(me.id.toString());
          setIsFollowing(followings.some((f) => f.id === authorId));
        } catch {}
      })();
    }, [authorId])
  );

  const handlePress = () => {
    router.push({ pathname: '/profile/[userId]', params: { userId: authorId.toString() } });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.avatarRing}>
        {authorAvatar ? (
          <Image source={{ uri: authorAvatar }} style={styles.authorAvatar} />
        ) : (
          <View style={[styles.authorAvatar, styles.avatarFallback]}>
            <Ionicons name="person" size={22} color={colors.white} />
          </View>
        )}
      </View>

      <View style={styles.authorInfo}>
        <Text style={styles.authorLabel}>{t('tourDetail.createdBy')}</Text>
        <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
      </View>

      {!isSelf && isFollowing && (
        <View style={styles.followingBadge}>
          <Ionicons name="checkmark" size={11} color={colors.primary} />
          <Text style={styles.followingBadgeText}>{t('tourDetail.following', 'Following')}</Text>
        </View>
      )}

      <Ionicons name="chevron-forward" size={18} color={colors.subText} />
    </TouchableOpacity>
  );
}
