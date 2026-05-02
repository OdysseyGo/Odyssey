import { apiRequest } from './APIClient';

// Type definitions
export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  xp: number;
  following_count: number;
  follower_count: number;
  token: number;
  level: number;
  country: string;
  user_type: number;
  tour_count: number;
  rating: number;
  avatar_url: string;
  credit?: number;
  total_walked_km: number | string;
  terms_update_required: boolean;
};

export type AddFriendUserDisplayDTO = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
};

export type AddFriendUserDisplayDTOListResponse = {
  count: number;
  next?: string;
  previous?: string;
  results: AddFriendUserDisplayDTO[];
};

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  terms_accepted: boolean;
};

export type UpdateUserPayload = {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
};

export type UsersListResponse = {
  count: number;
  next?: string;
  previous?: string;
  results: User[];
};

export type SearchHistoryType = 'tours' | 'users';

export type SearchHistoryItem = {
  id: number;
  search_type: SearchHistoryType;
  query: string;
  searched_at: string;
};

export type UserCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  access: string;
  refresh: string;
  terms_update_required: boolean;
};

export type FollowPayload = {
  following: number; //id of the target
};

export type FeedTour = {
  id: number;
  title: string;
  description: string;
  category: string;
  generation_source: 'USER' | 'AI';
  difficulty: string;
  duration_minutes: number;
  city?: string;
  country?: string;
  country_code?: string;
  cover_image?: string;
  cover_image_attribution?: string;
  created_at: string;
};

export type FeedItem = {
  id: number; // id of tourProgress, its a better key value then combining userid + tour.
  user: User;
  tour: FeedTour;
  completed_at: string;
};

export type FollowingFeedResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FeedItem[];
};

// Notification related types
export type DevicePlatform = 'ios' | 'android';

export type DeviceTokenRegistrationPayload = {
  device_token: string;
  platform: DevicePlatform;
};

export type DeviceTokenResponse = {
  id: number;
  device_token: string;
  platform: DevicePlatform;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// API functions

/**
 * GET /api/users/ - List all users with pagination
 * @param page - Page number (optional)
 * @param search - Search by username or name (optional)
 */
export const getUsers = (page?: number, search?: string, signal?: AbortSignal) =>
  apiRequest<UsersListResponse>({
    url: '/api/users/',
    params: {
      ...(page ? { page } : {}),
      ...(search ? { search } : {}),
    },
    signal,
  });

export const searchUsers = (query: string, signal?: AbortSignal) => getUsers(1, query, signal);

export const getSearchHistory = (searchType?: SearchHistoryType) =>
  apiRequest<SearchHistoryItem[]>({
    method: 'get',
    url: '/api/users/search-history/',
    params: searchType ? { search_type: searchType } : undefined,
  });

export const saveSearchHistory = (searchType: SearchHistoryType, query: string) =>
  apiRequest<SearchHistoryItem, { search_type: SearchHistoryType; query: string }>({
    method: 'post',
    url: '/api/users/search-history/',
    data: { search_type: searchType, query },
  });

export const clearSearchHistory = (searchType?: SearchHistoryType, query?: string) =>
  apiRequest<void>({
    method: 'delete',
    url: '/api/users/search-history/',
    params: {
      ...(searchType ? { search_type: searchType } : {}),
      ...(query ? { query } : {}),
    },
  });

/**
 * POST /api/users/ - Create a new user
 */
export const createUser = (payload: CreateUserPayload) =>
  apiRequest<User, CreateUserPayload>({
    method: 'post',
    url: '/api/users/',
    data: payload,
    auth: false, // Typically user creation doesn't require auth
  });

/**
 * GET /api/users/{id}/ - Get user by ID
 */
export const getUserById = (id: string) =>
  apiRequest<User>({
    url: `/api/users/${id}/`,
  });

/**
 * PUT /api/users/{id}/ - Update user (full update)
 */
export const updateUser = (id: string, payload: UpdateUserPayload) =>
  apiRequest<User, UpdateUserPayload>({
    method: 'put',
    url: `/api/users/${id}/`,
    data: payload,
  });

/**
 * PATCH /api/users/{id}/ - Partial update user
 */
export const partialUpdateUser = (id: string, payload: Partial<UpdateUserPayload>) =>
  apiRequest<User, Partial<UpdateUserPayload>>({
    method: 'patch',
    url: `/api/users/${id}/`,
    data: payload,
  });

/**
 * DELETE /api/users/{id}/ - Delete user
 */
export const deleteUser = (id: string) =>
  apiRequest<void>({
    method: 'delete',
    url: `/api/users/${id}/`,
  });

export const login = (payload: UserCredentials) =>
  apiRequest<LoginResponse>({
    method: 'post',
    url: `/api/users/login/`,
    data: payload,
    auth: false, // how can we do auth without loging in !
  });

export const getMe = () =>
  apiRequest<User>({
    method: 'get',
    url: `/api/users/me/`,
  });

export const getByUsername = (username: string) =>
  apiRequest<User>({
    method: 'get',
    url: `/api/users/get-by-username/`,
    params: { username },
    auth: false,
  });

export const requestPasswordReset = (email: string) =>
  apiRequest<void>({
    method: 'post',
    url: '/api/users/request-password-reset/',
    data: { email },
    auth: false,
  });

export const resetPassword = (payload: { email: string; code: string; new_password: string }) =>
  apiRequest<void>({
    method: 'post',
    url: '/api/users/reset-password/',
    data: payload,
    auth: false,
  });

export const acceptTermsUpdate = () =>
  apiRequest<{ terms_version: string }>({
    method: 'post',
    url: '/api/users/accept-terms/',
  });

export const followUser = (payload: FollowPayload) =>
  apiRequest<void>({
    method: 'post',
    url: '/api/follows/',
    data: payload,
  });

export const unfollowUser = (payload: FollowPayload) =>
  apiRequest<void>({
    method: 'delete',
    url: `/api/follows/${payload.following}/`,
  });

/**
 * Gets the users filtered by username for add friend list (includes filter, excludes itself and already following)
 * @param filter - checks if username contains the filter (same with sql LIKE %patern%)
 * @returns array of users
 */
export const getFilteredUsersAddFriend = (filter: string) =>
  apiRequest<AddFriendUserDisplayDTO[]>({
    method: 'get',
    url: `api/users/get-filtered-users-add-friend/?filter=${filter}`,
  });

/**
 * PATCH /api/users/me/avatar/ - Update avatar URL
 */
export const updateAvatar = (avatarUrl: string) =>
  apiRequest<{ avatar_url: string }>({
    method: 'patch',
    url: '/api/users/me/avatar/',
    data: { avatar_url: avatarUrl },
  });

/**
 * DELETE /api/users/{followerId}/remove-follower/ - Remove a follower from the current user's followers
 */
export const removeFollower = (followerId: number) =>
  apiRequest<void>({
    method: 'delete',
    url: `/api/users/${followerId}/remove-follower/`,
  });

/**
 * GET /api/users/{id}/published-tours/ - Get published tours created by the given user
 */
export const getUserPublishedTours = (id: string) =>
  apiRequest<import('./tours').Tour[]>({
    url: `/api/users/${id}/published-tours/`,
  });

/**
 * GET /api/users/{id}/followers/ - Get users who follow the given user
 */
export const getUserFollowers = (id: string) =>
  apiRequest<User[]>({
    url: `/api/users/${id}/followers/`,
  });

/**
 * GET /api/users/{id}/followings/ - Get users that the given user follows
 */
export const getUserFollowings = (id: string) =>
  apiRequest<User[]>({
    url: `/api/users/${id}/followings/`,
  });

/**
 * GET /api/users/following-feed/?page={page}
 * Get user's following feed, a paginated list of tours completed by people they follow.
 */
export const getFollowingFeed = (page: number = 1) =>
  apiRequest<FollowingFeedResponse>({
    url: `/api/users/following-feed/`,
    params: { page },
  });

/**
 * POST /api/notifications/device-tokens/register_token/
 * Registers or updates the push notification token for the current user.
 *
 */
export const registerDeviceToken = (payload: DeviceTokenRegistrationPayload) =>
  apiRequest<DeviceTokenResponse, DeviceTokenRegistrationPayload>({
    method: 'post',
    url: '/api/notifications/device-tokens/register_token/',
    data: payload,
  });