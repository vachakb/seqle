import { request } from "./client";

interface AuthResponse {
  token: string;
  user: { id: number; email: string; displayName: string | null };
}

interface MeResponse {
  user: { id: number; email: string; displayName: string | null };
}

export async function register(email: string, password: string, displayName?: string): Promise<AuthResponse> {
  const guestToken = localStorage.getItem("seqle-guest-token") || undefined;
  return request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName, guestToken }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/auth/me");
}
