"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase";
import type { AuthResult } from "@/lib/types";
import { setCurrentUser } from "@/lib/store";
import { fetchUserData, retryPending } from "@/lib/sync";

// ─── AuthContext 인터페이스 ────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── AuthProvider ──────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient();

  // 초기 세션 확인 + 인증 상태 변화 구독
  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);

      // 동기화 연결: 초기 세션에 user가 있으면 데이터 동기화
      const uid = currentSession?.user?.id ?? null;
      setCurrentUser(uid);
      if (uid) {
        fetchUserData(uid).catch(() => {});
        retryPending().catch(() => {});
      }
    });

    // onAuthStateChange 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      // 동기화 연결: user가 있으면 setCurrentUser + fetchUserData + retryPending
      const uid = newSession?.user?.id ?? null;
      setCurrentUser(uid);
      if (uid) {
        fetchUserData(uid).catch(() => {});
        retryPending().catch(() => {});
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── signIn (이메일/비밀번호) ──────────────────────────────────────────

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ─── signUp (이메일/비밀번호) ──────────────────────────────────────────

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, isNewUser: true };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // ─── signInWithGoogle (OAuth) ──────────────────────────────────────────

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── signOut ───────────────────────────────────────────────────────────

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Context value ─────────────────────────────────────────────────────

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── useAuth hook ────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
