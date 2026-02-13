import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, googleProvider } from "@/services/firebase";
import type { UserInfo } from "@/types";

const CACHED_USER_KEY = "screentask-user";

function getCachedUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function cacheUser(user: UserInfo | null) {
  if (user) {
    localStorage.setItem(
      CACHED_USER_KEY,
      JSON.stringify({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      }),
    );
  } else {
    localStorage.removeItem(CACHED_USER_KEY);
  }
}

export function useAuth() {
  const cached = getCachedUser();
  const [user, setUser] = useState<UserInfo | null>(cached);
  // If we have a cached user, skip the loading state entirely
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      console.error("Redirect sign-in failed:", err);
    });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const info: UserInfo = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        };
        setUser(info);
        cacheUser(info);
      } else {
        setUser(null);
        cacheUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-user") {
        await signInWithRedirect(auth, googleProvider);
      } else {
        console.error("Google sign-in failed:", err);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle,
    logout,
  };
}
