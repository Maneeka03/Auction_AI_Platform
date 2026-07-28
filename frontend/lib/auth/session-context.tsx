"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getMe, login as apiLogin, logout as apiLogout, refresh as apiRefresh } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import type { LoginPayload, Session } from "@/types/auth";

interface AuthContextValue {
  session: Session | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<Session>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let refreshInFlightPromise: Promise<string | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback(
    (expiresInSeconds: number) => {
      clearRefreshTimer();
      const delayMs = Math.max((expiresInSeconds - 60) * 1000, 5_000);
      refreshTimer.current = setTimeout(() => {
        void runRefresh();
      }, delayMs);
    },
    [clearRefreshTimer],
  );

  const runRefresh = useCallback(async (): Promise<string | null> => {
    if (refreshInFlightPromise) return refreshInFlightPromise;

    const task = (async () => {
      try {
        const token = await apiRefresh();
        setAccessToken(token.access_token);
        scheduleRefresh(token.expires_in);
        const me = await getMe(token.access_token);
        setSession(me);
        return token.access_token;
      } catch {
        setAccessToken(null);
        setSession(null);
        return null;
      } finally {
        refreshInFlightPromise = null;
      }
    })();

    refreshInFlightPromise = task;
    return task;
  }, [scheduleRefresh]);

  useEffect(() => {
    void runRefresh().finally(() => setIsLoading(false));
    return clearRefreshTimer;
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const token = await apiLogin(payload);
      setAccessToken(token.access_token);
      scheduleRefresh(token.expires_in);
      const me = await getMe(token.access_token);
      setSession(me);
      return me;
    },
    [scheduleRefresh],
  );

  const logout = useCallback(async () => {
    clearRefreshTimer();
    try {
      if (accessToken) await apiLogout(accessToken);
    } catch (error) {
      if (!(error instanceof ApiRequestError)) throw error;
    } finally {
      setAccessToken(null);
      setSession(null);
    }
  }, [accessToken, clearRefreshTimer]);

  return (
    <AuthContext.Provider value={{ session, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}