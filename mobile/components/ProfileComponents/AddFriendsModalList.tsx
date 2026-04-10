import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsModalListStyles } from './AddFriendsModalList.styles';
import type { AddFriendsModalListProps } from './AddFriendsModalList.config';
import { AddFriendUserDisplayDTO } from '@/api/users';
import { followUser, FollowPayload, getFilteredUsersAddFriend } from '@/api/users';

export default function AddFriendsModalList({ searchTextVal = '' }: AddFriendsModalListProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalListStyles(theme);
  const color = Colors[theme];

  const [users, setUsers] = useState<AddFriendUserDisplayDTO[]>([]);
  const [followedIds, setFollowedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const query = searchTextVal.trim();

    if (!query) {
      setUsers([]);
      setFollowedIds(new Set());
      return;
    }

    const fetchData = async () => {
      try {
        const data = await getFilteredUsersAddFriend(query);
        setUsers(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, [searchTextVal]);

  async function followHandler(user_id: number) {
    // Optimistically show checkmark immediately
    setFollowedIds((prev) => new Set(prev).add(user_id));

    try {
      const payload: FollowPayload = { following: user_id };
      await followUser(payload);
    } catch (e) {
      console.error(e);
      // Revert on failure
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(user_id);
        return next;
      });
      return;
    }
  }

  const renderItem = ({ item }: { item: AddFriendUserDisplayDTO }) => {
    const justFollowed = followedIds.has(item.id);
    return (
      <View style={styles.userRow}>
        <View style={styles.userInfo}>
          <View style={styles.avatarPlaceholder}>
            <FontAwesome name="user" size={14} color="white" />
          </View>
          <Text style={styles.username}>{item.username}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addButton, justFollowed && { backgroundColor: color.primary }]}
          onPress={() => !justFollowed && followHandler(item.id)}
          activeOpacity={justFollowed ? 1 : 0.7}
        >
          <FontAwesome
            name={justFollowed ? 'check' : 'user-plus'}
            size={justFollowed ? 16 : 18}
            color={justFollowed ? 'white' : color.primary}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {searchTextVal ? 'No users found' : 'Start typing to search'}
        </Text>
      }
      contentContainerStyle={styles.listContainer}
    />
  );
}
