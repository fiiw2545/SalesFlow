import apiClient from "../../../api/client";
import endpoints from "../../../api/endpoints";

import type {
  AuthUser,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData,
  ChangePasswordResponse,
} from "../types/auth.types";

// Register
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post(endpoints.auth.register, data);

  return response.data;
};

// Login
export const login = async (
  credentials: LoginCredentials,
): Promise<AuthResponse> => {
  const response = await apiClient.post(endpoints.auth.login, credentials);

  return response.data;
};

// Logout
export const logout = async (): Promise<AuthResponse> => {
  const response = await apiClient.post(endpoints.auth.logout);

  return response.data;
};

// Get Current User
export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiClient.get(endpoints.auth.me);

  return response.data;
};

// Update Current User Profile
export const updateProfile = async (
  data: UpdateProfileData,
): Promise<AuthResponse> => {
  const response = await apiClient.patch(endpoints.auth.me, data);

  return response.data;
};

// Change Password
export const changePassword = async (
  data: ChangePasswordData,
): Promise<ChangePasswordResponse> => {
  const response = await apiClient.patch("/auth/change-password", data);

  return response.data;
};

// Refresh Session
export const refreshSession = async (): Promise<AuthResponse> => {
  const response = await apiClient.post(endpoints.auth.refresh);

  return response.data;
};
