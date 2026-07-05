import { api } from "./api";

export interface AuthUser {
  id?: string;
  username?: string;
  email: string;
}

interface AuthResponse {
  token: string;
  _id: string;
  username: string;
  email: string;
}

export async function loginRequest(email: string, password: string, publicKey: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password, publicKey });
  return data;
}

export async function registerRequest(
  username: string,
  email: string,
  password: string,
  publicKey: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/register", {
    username,
    email,
    password,
    publicKey,
  });
  return data;
}
