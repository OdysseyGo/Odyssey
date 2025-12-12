import React, { use, useCallback, useState } from "react";
import { View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import ProfileHeaderComp from "@/components/ProfileComponents/ProfileHeaderComp";  //exampleları çıkardım
import ProfileStatsComp from "@/components/ProfileComponents/ProfileStatsComp";
import { getMe, getMyBadges, User } from "@/api/users";

export default function Profile() {
  const [curUser, setCurUser] = useState<User | null>(null);
  const [badgesCount, setBadgesCount] = useState(0)
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
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

  if (loading || !curUser) return <View />;

  const profileHeader = {
    title: curUser.username,
    subtitle: curUser.country,
  };

  const profileStats = {
    xp: curUser.xp,
    tours: curUser.tour_count,
    badges: badgesCount, // needs another API call
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
