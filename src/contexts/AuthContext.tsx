"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  nickname: string | null;
  signOut: () => Promise<void>;
  refreshNickname: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState<string | null>(null);
  const supabase = createClient();

  async function fetchNickname(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("nickname")
      .eq("id", userId)
      .single();
    setNickname(data?.nickname ?? null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchNickname(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchNickname(session.user.id);
        else setNickname(null);
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshNickname() {
    if (user) await fetchNickname(user.id);
  }

  return (
    <AuthContext.Provider value={{ user, loading, nickname, signOut, refreshNickname }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
