"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "./supabaseClient";
import { clearTries } from "./useTryCounter";
import type { Session, User } from "@supabase/supabase-js";

/**
 * Session hook. When Supabase is not configured the app runs fully
 * anonymous and `session` stays null — everything degrades gracefully.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data }) => {
        setSession(data.session);
        setIsLoading(false);
        if (data.session?.user) clearTries(); // signed-in = unlimited
      })
      .catch(() => setIsLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s?.user) clearTries();
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, [supabase]);

  return {
    session,
    user: session?.user ?? null,
    email: session?.user?.email ?? null,
    isSignedIn: Boolean(session?.user),
    isLoading,
    isConfigured: Boolean(supabase),
    signOut,
  };
}

export type { User };
