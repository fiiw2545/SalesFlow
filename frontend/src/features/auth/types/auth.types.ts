export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateProfileData {
  name: string;
}

export interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}
