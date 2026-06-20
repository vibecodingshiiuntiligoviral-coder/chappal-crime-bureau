"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";
import type { SessionState } from "@/types";

const SupabaseSessionContext = createContext<SessionState | null>(null);

export function SupabaseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(() =>
    isSupabaseConfigured
      ? { status: "loading", uid: null }
      : {
          status: "disabled",
          uid: null,
          errorMessage: "Public filing desk is offline for configuration reasons.",
        },
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    const client = getSupabaseClient();
    let active = true;

    const setReadySession = (userId: string) => {
      if (!active) {
        return;
      }

      setSession({
        status: "ready",
        uid: userId,
      });
    };

    const setAuthError = (fallback: string, error?: unknown) => {
      if (!active) {
        return;
      }

      const errorMessage =
        error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : fallback;

      setSession({
        status: "error",
        uid: null,
        errorMessage,
      });
    };

    async function ensureAnonymousSession() {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await client.auth.getSession();

      if (sessionError) {
        setAuthError("Could not restore the guest session.", sessionError);
        return;
      }

      const existingUserId = currentSession?.user?.id;
      if (existingUserId) {
        setReadySession(existingUserId);
        return;
      }

      const { data, error } = await client.auth.signInAnonymously();

      if (error || !data.user?.id) {
        setAuthError(
          "Guest filing could not be opened. Enable anonymous sign-ins for this project.",
          error,
        );
        return;
      }

      setReadySession(data.user.id);
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, currentSession) => {
      const userId = currentSession?.user?.id ?? null;

      if (userId) {
        setReadySession(userId);
        return;
      }

      if (active) {
        setSession({ status: "loading", uid: null });
      }
    });

    ensureAnonymousSession().catch((error) => {
      setAuthError("Could not start the guest session.", error);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseSessionContext.Provider value={session}>
      {children}
    </SupabaseSessionContext.Provider>
  );
}

export function useSupabaseSession() {
  const session = useContext(SupabaseSessionContext);

  if (!session) {
    throw new Error("useSupabaseSession must be used within SupabaseSessionProvider.");
  }

  return session;
}
