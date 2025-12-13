import { apiRequest } from './APIClient';

// Type definitions
export type User = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  xp: number;
  follow_count: number;
  follower_count: number;
  token: number;
  level: number;
  country: string;
  user_type: number;
  tour_count: number;
  rating: number;
};

export type CreateUserPayload = {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
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

export type UserCredentials = {
  username: string;
  password: string;
};

// API functions

/**
 * GET /api/users/ - List all users with pagination
 * @param page - Page number (optional)
 */
export const getUsers = (page?: number) =>
  apiRequest<UsersListResponse>({
    url: '/api/users/',
    params: page ? { page } : undefined,
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
  apiRequest<void>({
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
    url: `/api/users/get_by_username/`,
    params: { username },
    auth: false,
  });

export const resetPassword = (
  payload: { username: string; email: string; new_password: string } //This is only for the demo, it should be changed in the future
) =>
  apiRequest<void>({
    method: 'post',
    url: '/api/users/reset_password/',
    data: payload,
    auth: false,
  });
