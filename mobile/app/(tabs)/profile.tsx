import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { Ionicons } from '@expo/vector-icons';
import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { router as routerNav } from 'expo-router';

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

  const USER_TYPE_LABELS: Record<number, string> = {
    1: 'Free',
    2: 'Premium',
  };

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
          You need to be logged in to view your profile.
        </Text>
        <AuthButton title="Oooh I want to log in!" onPress={() => router.push('/login')} />
      </View>
    );
  }

  if (loading || !curUser) return <View />;

  const isPremiumOrCreator = curUser.user_type === 2;
  const tierLabel = USER_TYPE_LABELS[curUser.user_type] || 'Free';

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

        {/* Tier + credit pills sitting on the seam */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: Spacing.md,
            paddingHorizontal: Spacing.lg,
            marginTop: -Spacing.lg,
            marginBottom: Spacing.sm,
            zIndex: 10,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: isPremiumOrCreator ? '#FF6B6B' : color.subText,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>{tierLabel}</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: '#FFD93D',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 999,
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons name="diamond" size={12} color="#1a1a1a" />
            <Text style={{ color: '#1a1a1a', fontSize: 12, fontWeight: '700' }}>
              {curUser.credit} credits
            </Text>
          </View>
        </View>

        <ProfileStatsComp {...profileStats} />
        <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm }}>
          <ProfileAddFriendsButton onPress={handleOpenAddFriendModal} />
        </View>
        <ProfileBadgesContainer badges={formattedBadges} title="Badges" maxDisplay={3} />
        <ProfileToursContainer />
        <View
          style={{
            paddingHorizontal: Spacing.lg,
            paddingTop: Spacing.lg,
            paddingBottom: Spacing.xl,
          }}
        >
          <AuthButton title="Logout" onPress={handleLogout} />
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
