import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import {
  type AuthUser,
  fetchCurrentUser,
  isRemoteApiConfigured,
  lineLoginUrl,
  logoutRemoteUser,
} from "../lib/api";

type AuthStatus = "disabled" | "loading" | "signed-out" | "signed-in";

export type AuthContextValue = {
  isConfigured: boolean;
  status: AuthStatus;
  user: AuthUser | null;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(
    isRemoteApiConfigured ? "loading" : "disabled"
  );

  const refreshUser = useCallback(async () => {
    if (!isRemoteApiConfigured) {
      setStatus("disabled");
      setUser(null);
      return;
    }

    try {
      setStatus("loading");
      const response = await fetchCurrentUser();
      setUser(response.user);
      setStatus(response.user ? "signed-in" : "signed-out");
    } catch (error) {
      console.error("Could not load signed-in user.", error);
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const signIn = useCallback(() => {
    if (!isRemoteApiConfigured) return;
    window.location.assign(lineLoginUrl());
  }, []);

  const signOut = useCallback(async () => {
    if (!isRemoteApiConfigured) return;

    try {
      await logoutRemoteUser();
    } finally {
      setUser(null);
      setStatus("signed-out");
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isRemoteApiConfigured,
      status,
      user,
      signIn,
      signOut,
      refreshUser,
    }),
    [refreshUser, signIn, signOut, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
