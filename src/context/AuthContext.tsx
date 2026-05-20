import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import { mergeStats as mergeStatsApi } from "../api/stats";
import type { GameStats } from "../api/stats";

interface User {
  id: number;
  email: string;
  displayName: string | null;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("seqle-auth-token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    authApi.getMe()
      .then(res => setUser(res.user))
      .catch(() => localStorage.removeItem("seqle-auth-token"))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("seqle-auth-token", res.token);
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    const res = await authApi.register(email, password, displayName);
    localStorage.setItem("seqle-auth-token", res.token);
    setUser(res.user);

    const localStatsRaw = localStorage.getItem("seqle-stats");
    if (localStatsRaw) {
      try {
        const localStats: GameStats = JSON.parse(localStatsRaw);
        if (localStats.gamesPlayed > 0) {
          await mergeStatsApi(localStats);
        }
      } catch {
        // ignore parse errors
      }
    }

    localStorage.removeItem("seqle-guest-token");
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("seqle-auth-token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
