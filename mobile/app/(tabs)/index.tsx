import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Button } from 'react-native'; //İLERDE GELECEK İNSAN İÇİN BU button MANUAL LOGOUT TUŞU!!!! TEST İÇİN 

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

import { getUserById, type User } from '@/api/users';
import * as SecureStore from "expo-secure-store"; //İLERDE GELECEK İNSAN İÇİN BU hepsi MANUAL LOGOUT TUŞU!!!! TEST İÇİN


export default function TabOneScreen() {
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setUserLoading(true);
      try {
        const userData = await getUserById('1');
        setUser(userData);
      } catch (err: any) {
        setError(err.message ?? 'Failed to fetch user');
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>

      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

      {/* ------------ USER DATA BOX ------------ */}
      {userLoading && (
        <View style={styles.statusBox}>
          <ActivityIndicator />
          <Text>Loading user…</Text>
        </View>
      )}

      {user && (
        <View style={styles.userBox}>
          <Text style={styles.subtitle}>User ID 1 Details:</Text>
          <Text>Username: {user.username}</Text>
          <Text>Email: {user.email}</Text>
          <Text>
            Name: {user.first_name} {user.last_name}
          </Text>
          <Text>Level: {user.level}</Text>
          <Text>XP: {user.xp}</Text>
          <Text>Rating: {user.rating}</Text>
          <Text>Tours: {user.tour_count}</Text>
          <Text>Followers: {user.follower_count}</Text>
          <Text>Following: {user.follow_count}</Text>
          <Text>Country: {user.country}</Text>
        </View>
      )}
      {/* ------------ END USER DATA BOX ------------ */}

      <Button title="RESET" onPress={async () => { //İLERDE GELECEK İNSAN İÇİN BU button MANUAL LOGOUT TUŞU!!!! TEST İÇİN
        await SecureStore.deleteItemAsync("userToken");
        await SecureStore.deleteItemAsync("refreshToken");
        alert("cleared!");
      }} />

      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
  statusBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userBox: {
    alignItems: 'flex-start',
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
    width: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
