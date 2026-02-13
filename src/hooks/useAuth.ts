import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/services/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google sign-in failed:", err);
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
