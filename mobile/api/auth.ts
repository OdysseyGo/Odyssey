import * as SecureStore from 'expo-secure-store';
import { getMe, User } from './users';

/**
 * Check if user is currently logged in by checking for stored token
 */
export async function isLoggedIn(): Promise<boolean> {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Get the current user if logged in
 * Returns null if not logged in or if the request fails
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return null;
    
    const user = await getMe();
    return user;
  } catch {
    return null;
  }
}

/**
 * Get the stored auth token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('userToken');
  } catch {
    return null;
  }
}

/**
 * Store auth token after login
 */
export async function setAuthToken(token: string): Promise<void> {
  await SecureStore.setItemAsync('userToken', token);
}

/**
 * Remove auth token on logout
 */
export async function removeAuthToken(): Promise<void> {
  await SecureStore.deleteItemAsync('userToken');
}
