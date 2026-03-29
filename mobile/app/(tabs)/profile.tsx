import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import ProfileAddFriendsButton from '@/components/ProfileComponents/ProfileAddFriendsButton';
import ProfileBadgesContainer from '@/components/ProfileComponents/ProfileBadgesContainer';
import ProfileToursContainer from '@/components/ProfileComponents/ProfileToursContainer';
import AddFriendsModal from '@/components/ProfileComponents/AddFriendsModal';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { getMe, User } from '@/api/users';
import { getMyBadges, Badge } from '@/api/profile';
import { removeAuthToken } from '@/api/auth';
import * as SecureStore from 'expo-secure-store';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

async function getAccessToken() {
  return await SecureStore.getItemAsync('userToken');
}

export default function Profile() {
  const [curUser, setCurUser] = useState<User | null>(null);
  const [badgesCount, setBadgesCount] = useState(0);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const theme = useColorTheme();
  const color = Colors[theme];
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        const token = await getAccessToken();

        if (!token) {
          setHasToken(false);
          setLoading(false);
          return;
        }

        setHasToken(true);
        //alert(token)
        try {
          const user = await getMe();
          const badgesResponse = await getMyBadges();

          if (isActive) {
            setCurUser(user);
            setBadgesCount(badgesResponse.count);
            setBadges(badgesResponse.results);
          }
        } catch (err) {
          console.error('Failed to load profile:', err);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchProfile();

      return () => {
        isActive = false; // stop updates if screen unfocused
      };
    }, [])
  );

  // Move these hooks BEFORE any conditional returns
  const handleOpenAddFriendModal = () => {
    setShowAddFriendModal(true);
  };

  const handleLogout = async () => {
    await removeAuthToken();
    setHasToken(false);
    setCurUser(null);
    router.push('/login');
  };

  if (!hasToken) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: Spacing.xl,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            marginBottom: Spacing.lg,
            textAlign: 'center',
            color: color.subText,
          }}
        >
          {t('profile.notLoggedIn')}
        </Text>
        <AuthButton title={t('profile.loginButton')} onPress={() => router.push('/login')} />
      </View>
    );
  }

  if (loading || !curUser) return <View />;

  const profileHeader = {
    title: curUser.username,
    subtitle: curUser.country,
  };

  const profileStats = {
    xp: curUser.xp,
    tours: curUser.tour_count,
    badges: badgesCount,
    followers: curUser.follower_count,
    following: curUser.follow_count,
  };

  // Convert API badges to component format
  const formattedBadges = badges.map((badge) => ({
    id: badge.id.toString(),
    name: badge.name,
    icon: badge.icon,
    description: badge.description,
    unlocked: true,
    earnedDate: badge.created_at,
  }));

  return (
    <>
      <ScrollView>
        <ProfileHeaderComp {...profileHeader} />
        <ProfileStatsComp {...profileStats} />
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
          <ProfileAddFriendsButton onPress={handleOpenAddFriendModal} />
        </View>
        <ProfileBadgesContainer
          badges={formattedBadges}
          title={t('profile.badges')}
          maxDisplay={3}
        />
        <ProfileToursContainer />
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.xl,
          }}
        >
          <AuthButton title={t('profile.logout')} onPress={handleLogout} />
        </View>
      </ScrollView>

      <AddFriendsModal
        visible={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        searchFocused={searchFocused}
        onSearchFocus={setSearchFocused}
      />
    </>
  );
}
