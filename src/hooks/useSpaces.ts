import { useState, useCallback, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  query,
  orderBy,
  getDocs,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Space } from "@/types";

const ACTIVE_SPACE_KEY = "screentask-active-space";

function spacesCollection(uid: string) {
  return collection(db, "users", uid, "spaces");
}

function spaceDoc(uid: string, spaceId: string) {
  return doc(db, "users", uid, "spaces", spaceId);
}

function todosCollection(uid: string) {
  return collection(db, "users", uid, "todos");
}

export function useSpaces(userId: string | null) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpaceId, setActiveSpaceIdState] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_SPACE_KEY);
  });

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const spacesRef = useRef(spaces);
  spacesRef.current = spaces;

  const hasInitializedRef = useRef(false);

  // Persist active space to localStorage
  const setActiveSpaceId = useCallback((id: string) => {
    setActiveSpaceIdState(id);
    localStorage.setItem(ACTIVE_SPACE_KEY, id);
  }, []);

  // Migrate orphaned todos (no spaceId) to a given space
  const migrateOrphanedTodos = useCallback(async (uid: string, defaultSpaceId: string) => {
    const todosRef = todosCollection(uid);
    const snapshot = await getDocs(todosRef);
    const orphans = snapshot.docs.filter((d) => !d.data().spaceId);
    if (orphans.length === 0) return;

    const batch = writeBatch(db);
    orphans.forEach((d) => {
      batch.update(d.ref, { spaceId: defaultSpaceId });
    });
    await batch.commit();
  }, []);

  // Clear state on logout
  useEffect(() => {
    if (!userId) {
      setSpaces([]);
      hasInitializedRef.current = false;
    }
  }, [userId]);

  // Firestore subscription
  useEffect(() => {
    if (!userId) return;

    const q = query(spacesCollection(userId), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreSpaces: Space[] = snapshot.docs.map((d) => d.data() as Space);
        firestoreSpaces.sort((a, b) => a.order - b.order);

        // If no spaces exist, create default "Personal" space
        if (firestoreSpaces.length === 0 && !hasInitializedRef.current) {
          hasInitializedRef.current = true;
          const id = crypto.randomUUID();
          const defaultSpace: Space = {
            id,
            name: "Personal",
            createdAt: Date.now(),
            order: 0,
          };
          setDoc(spaceDoc(userId, id), defaultSpace)
            .then(() => migrateOrphanedTodos(userId, id))
            .catch((err) => console.error("Failed to create default space:", err));
          // The onSnapshot will fire again with the new space
          return;
        }

        console.log("[useSpaces] snapshot", { count: firestoreSpaces.length, spaces: firestoreSpaces.map(s => ({ id: s.id, name: s.name })) });
        setSpaces(firestoreSpaces);

        // Resolve active space ID
        if (firestoreSpaces.length > 0) {
          const storedId = localStorage.getItem(ACTIVE_SPACE_KEY);
          const isValid = firestoreSpaces.some((s) => s.id === storedId);
          console.log("[useSpaces] resolving activeSpaceId", { storedId, isValid });
          if (!isValid) {
            const firstId = firestoreSpaces[0]!.id;
            setActiveSpaceIdState(firstId);
            localStorage.setItem(ACTIVE_SPACE_KEY, firstId);
          }
        }
      },
      (error) => {
        console.error("Spaces subscription error:", error);
      },
    );

    return unsubscribe;
  }, [userId, migrateOrphanedTodos]);

  const createSpace = useCallback(async (name: string) => {
    const uid = userIdRef.current;
    if (!uid) return null;
    const id = crypto.randomUUID();
    const newSpace: Space = {
      id,
      name,
      createdAt: Date.now(),
      order: Date.now(),
    };
    await setDoc(spaceDoc(uid, id), newSpace);
    return id;
  }, []);

  const renameSpace = useCallback(async (id: string, name: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    const existing = spacesRef.current.find((s) => s.id === id);
    if (!existing) return;
    await setDoc(spaceDoc(uid, id), { ...existing, name });
  }, []);

  const deleteSpace = useCallback(async (id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    // Prevent deleting last space
    if (spacesRef.current.length <= 1) return;

    // Delete all todos in this space
    const todosRef = todosCollection(uid);
    const q = query(todosRef, where("spaceId", "==", id));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    batch.delete(spaceDoc(uid, id));
    await batch.commit();

    // If active space was deleted, switch to first remaining
    if (activeSpaceId === id) {
      const remaining = spacesRef.current.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveSpaceId(remaining[0]!.id);
      }
    }
  }, [activeSpaceId, setActiveSpaceId]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0] ?? null;

  return {
    spaces,
    activeSpaceId: activeSpace?.id ?? null,
    activeSpace,
    setActiveSpaceId,
    createSpace,
    renameSpace,
    deleteSpace,
  };
}
