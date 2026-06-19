"use client";

import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import type { SessionState } from "@/types";

const FirebaseSessionContext = createContext<SessionState | null>(null);

export function FirebaseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(() =>
    isFirebaseConfigured
      ? { status: "loading", uid: null }
      : {
          status: "disabled",
          uid: null,
          errorMessage: "Firebase env values are missing for this app.",
        },
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const auth = getFirebaseAuth();
    let active = true;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!active) {
        return;
      }

      if (user) {
        setSession({ status: "ready", uid: user.uid });
        return;
      }

      setSession({ status: "loading", uid: null });
    });

    setPersistence(auth, browserLocalPersistence)
      .then(async () => {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setSession({
          status: "error",
          uid: null,
          errorMessage:
            "Anonymous auth failed. Enable Anonymous sign-in in Firebase Authentication.",
        });
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return (
    <FirebaseSessionContext.Provider value={session}>
      {children}
    </FirebaseSessionContext.Provider>
  );
}

export function useFirebaseSession() {
  const session = useContext(FirebaseSessionContext);

  if (!session) {
    throw new Error("useFirebaseSession must be used within FirebaseSessionProvider.");
  }

  return session;
}
