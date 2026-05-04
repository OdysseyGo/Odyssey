import * as SecureStore from 'expo-secure-store';
import { getMe, User, deregisterDeviceToken } from './users';

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
 * Clears token on auth failure
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) return null;

    const user = await getMe();
    return user;
  } catch (error: any) {
    // If getCurrentUser fails, clear the invalid token
    if (error.statusCode === 401) {
      await removeAuthToken();
    }
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
 * Remove auth token on logout or when login fails
 */
export async function removeAuthToken(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync('userToken'),
    SecureStore.deleteItemAsync('refreshToken'),
    SecureStore.deleteItemAsync('devicePushToken'),
  ]);
}

/**
 * Logout and clear all auth data
 * Call this when login fails or user explicitly logs out
 */
export async function logout(): Promise<void> {
  try {
    const pushToken = await SecureStore.getItemAsync('devicePushToken');

    if (pushToken) {
      await deregisterDeviceToken({ device_token: pushToken });
    }
  } catch (error) {
    console.warn('Failed to deregister push token on logout:', error);
  } finally {
    await removeAuthToken();
  }
}
