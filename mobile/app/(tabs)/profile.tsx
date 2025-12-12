import React, { use, useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ProfileHeaderComp from '@/components/ProfileComponents/ProfileHeaderComp';
import ProfileStatsComp from '@/components/ProfileComponents/ProfileStatsComp';
import { View, Text, Button } from 'react-native';
import { router } from 'expo-router';
import AuthSubButton from '@/components/LoginComponents/AuthSubButton';
import AuthButton from '@/components/LoginComponents/AuthButton';
import { getMe, getMyBadges, User } from "@/api/users";
import * as SecureStore from "expo-secure-store"; 

async function getAccessToken() {
  return await SecureStore.getItemAsync("userToken"); 
}

export default function Profile() {
  const [curUser, setCurUser] = useState<User | null>(null);
  const [badgesCount, setBadgesCount] = useState(0)
  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

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
          const badges = await getMyBadges();
          
          if (isActive) {
            setCurUser(user);
            setBadgesCount(badges.count)
          }
        } catch (err) {
          console.error("Failed to load profile:", err);
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

  if (!hasToken) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center', color: '#666' }}>
          You need to be logged in to view your profile.
        </Text>
        <AuthButton title="Oooh I want to log in!" onPress={() => router.push('/login')} />
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

  return (
    <View>
      <ProfileHeaderComp {...profileHeader} />
      <ProfileStatsComp {...profileStats} />
    </View>
  );
}
