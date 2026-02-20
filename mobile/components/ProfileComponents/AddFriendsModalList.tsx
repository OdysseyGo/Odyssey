import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { useColorTheme } from '@/utils/useColorTheme';
import Colors from '@/constants/Colors';
import { addFriendsModalListStyles } from './AddFriendsModalList.styles';
import type { AddFriendsModalListProps } from './AddFriendsModalList.config';
import type { User } from '@/api/users';
import { followUser, FollowPayload, getFilteredUsersAddFriend } from '@/api/users';

export default function AddFriendsModalList({ searchTextVal = '' }: AddFriendsModalListProps) {
  const theme = useColorTheme();
  const styles = addFriendsModalListStyles(theme);
  const color = Colors[theme];

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const query = searchTextVal.trim();

    if (!query) {
      setUsers([]);
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
    try {
      const payload: FollowPayload = {
        followee: user_id,
      };
      const response = await followUser(payload); // TODO: give alert to notify user that the follow is done
    } catch (e) {
      console.error(e);
    }
  }

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <View style={styles.avatarPlaceholder}>
          <FontAwesome name="user" size={14} color="white" />
        </View>

        <Text style={styles.username}>{item.username}</Text>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={() => followHandler(item.id)}>
        <FontAwesome name="user-plus" size={18} color={color.primary} />
      </TouchableOpacity>
    </View>
  );

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
