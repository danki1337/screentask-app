import { useState, useCallback, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Todo } from "@/types";

function todosCollection(uid: string) {
  return collection(db, "users", uid, "todos");
}

function todoDoc(uid: string, todoId: string) {
  return doc(db, "users", uid, "todos", todoId);
}

// --- Backup helpers ---
const BACKUP_KEY = "screentask-backup";
const BACKUP_HISTORY_KEY = "screentask-backup-history";
const MAX_HISTORY = 10;

function saveBackup(uid: string, todos: Todo[]) {
  try {
    const entry = { uid, todos, ts: Date.now() };
    localStorage.setItem(BACKUP_KEY, JSON.stringify(entry));

    // Append to rolling history (keep last MAX_HISTORY snapshots with >0 todos)
    if (todos.length > 0) {
      const raw = localStorage.getItem(BACKUP_HISTORY_KEY);
      const history: { uid: string; todos: Todo[]; ts: number }[] = raw ? JSON.parse(raw) : [];
      history.push(entry);
      // Keep only the last MAX_HISTORY entries for this user
      const forUser = history.filter((h) => h.uid === uid).slice(-MAX_HISTORY);
      const forOthers = history.filter((h) => h.uid !== uid);
      localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify([...forOthers, ...forUser]));
    }
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadBackup(uid: string): { todos: Todo[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (entry.uid !== uid) return null;
    return { todos: entry.todos, ts: entry.ts };
  } catch {
    return null;
  }
}

export function useTodos(userId: string | null = null) {
  const [todos, setTodos] = useState<Todo[]>([]);

  const todosRef = useRef(todos);
  todosRef.current = todos;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const isFirstSnapshot = useRef(true);

  // Clear todos when user logs out
  useEffect(() => {
    if (!userId) {
      setTodos([]);
      isFirstSnapshot.current = true;
    }
  }, [userId]);

  // --- Backup todos to localStorage on every change ---
  useEffect(() => {
    if (userId && todos.length > 0) {
      saveBackup(userId, todos);
    }
  }, [todos, userId]);

  // --- Firestore subscription ---
  useEffect(() => {
    if (!userId) return;
    isFirstSnapshot.current = true;

    const unsubscribe = onSnapshot(
      todosCollection(userId),
      (snapshot) => {
        const firestoreTodos: Todo[] = snapshot.docs.map((d) => d.data() as Todo);
        firestoreTodos.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));

        // Auto-recovery: if first snapshot is empty but we have a recent backup, restore it
        if (isFirstSnapshot.current && firestoreTodos.length === 0) {
          const backup = loadBackup(userId);
          if (backup && backup.todos.length > 0) {
            const ageMinutes = (Date.now() - backup.ts) / 60000;
            if (ageMinutes < 60) {
              console.warn(`[useTodos] Firestore empty but backup has ${backup.todos.length} todos (${Math.round(ageMinutes)}min old). Restoring...`);
              setTodos(backup.todos);
              // Re-persist backup to Firestore
              const uid = userId;
              backup.todos.forEach((todo) => {
                const clean = Object.fromEntries(
                  Object.entries(todo).filter(([, v]) => v !== undefined),
                );
                setDoc(todoDoc(uid, todo.id), clean).catch((err) =>
                  console.error("[useTodos] backup restore setDoc FAILED:", err.code, err.message),
                );
              });
              isFirstSnapshot.current = false;
              return;
            }
          }
        }

        isFirstSnapshot.current = false;
        setTodos(firestoreTodos);
      },
      (error) => {
        console.error("[useTodos] onSnapshot ERROR:", error.code, error.message);
        // On error, try to load from backup
        if (userId) {
          const backup = loadBackup(userId);
          if (backup && backup.todos.length > 0) {
            console.warn(`[useTodos] Falling back to backup (${backup.todos.length} todos)`);
            setTodos(backup.todos);
          }
        }
      },
    );

    return unsubscribe;
  }, [userId]);

  // --- Reset stale scheduled tasks (past dates) to backlog once per day ---
  const lastCleanupDateRef = useRef<string>("");
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]!;
    if (lastCleanupDateRef.current === today) return;
    lastCleanupDateRef.current = today;
    setTodos((prev) => {
      const hasStale = prev.some(
        (t) => !t.completed && t.scheduledDate && t.scheduledDate < today,
      );
      if (!hasStale) return prev;
      const updated = prev.map((t) =>
        !t.completed && t.scheduledDate && t.scheduledDate < today
          ? { ...t, scheduledDate: undefined }
          : t,
      );
      // Persist stale cleanup to Firestore
      if (userIdRef.current) {
        const uid = userIdRef.current;
        updated
          .filter(
            (t, i) =>
              t.scheduledDate !== prev[i]?.scheduledDate,
          )
          .forEach((t) => {
            setDoc(todoDoc(uid, t.id), t).catch((err) =>
              console.error("[useTodos] stale cleanup setDoc FAILED:", err.code, err.message),
            );
          });
      }
      return updated;
    });
  }, []);

  // --- Firestore helpers ---
  const persistToFirestore = useCallback(
    (...todosToSave: Todo[]) => {
      const uid = userIdRef.current;
      if (!uid) return;
      todosToSave.forEach((todo) => {
        // Strip undefined values — Firestore throws on undefined fields
        const clean = Object.fromEntries(
          Object.entries(todo).filter(([, v]) => v !== undefined),
        );
        setDoc(todoDoc(uid, todo.id), clean).catch((err) =>
          console.error("[useTodos] setDoc FAILED:", err.code, err.message),
        );
      });
    },
    [],
  );

  const deleteFromFirestore = useCallback((id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    deleteDoc(todoDoc(uid, id)).catch((err) =>
      console.error("[useTodos] deleteDoc FAILED:", err.code, err.message),
    );
  }, []);

  // --- Helper to update state and sync ---
  const updateTodos = useCallback(
    (
      updater: (prev: Todo[]) => Todo[],
      opts?: { deleted?: string[]; changed?: (prev: Todo[], next: Todo[]) => Todo[] },
    ) => {
      setTodos((prev) => {
        const next = updater(prev);
        if (next === prev) return prev;
        // Sync deletions
        if (opts?.deleted) {
          opts.deleted.forEach(deleteFromFirestore);
        }
        // Sync changed todos
        if (userIdRef.current) {
          if (opts?.changed) {
            const changedTodos = opts.changed(prev, next);
            if (changedTodos.length > 0) persistToFirestore(...changedTodos);
          } else {
            // Diff: find todos that changed
            const prevMap = new Map(prev.map((t) => [t.id, t]));
            const changedTodos = next.filter((t) => prevMap.get(t.id) !== t);
            if (changedTodos.length > 0) persistToFirestore(...changedTodos);
          }
        }
        return next;
      });
    },
    [persistToFirestore, deleteFromFirestore],
  );

  const addTodos = useCallback(
    (texts: string[], description?: string) => {
      const now = Date.now();
      const newTodos: Todo[] = texts.map((text, i) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: now + i,
        order: now + i,
        ...(i === 0 && description ? { description } : {}),
      }));
      updateTodos(
        (prev) => [...newTodos, ...prev],
        {
          changed: () => newTodos,
        },
      );
      if (userIdRef.current) {
        persistToFirestore(...newTodos);
      }
    },
    [updateTodos, persistToFirestore],
  );

  const addOcrTasks = useCallback(
    (source: string, mainTask: string, subtasks: string[]) => {
      const parentId = crypto.randomUUID();
      const now = Date.now();
      const parent: Todo = {
        id: parentId,
        text: mainTask,
        completed: false,
        createdAt: now,
        order: now,
        source,
      };
      const children: Todo[] = subtasks.map((text, i) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: now + i + 1,
        order: now + i + 1,
        parentId,
      }));
      const allNew = [parent, ...children];
      updateTodos(
        (prev) => [...allNew, ...prev],
        { changed: () => allNew },
      );
      if (userIdRef.current) {
        persistToFirestore(...allNew);
      }
    },
    [updateTodos, persistToFirestore],
  );

  const toggleTodo = useCallback(
    (id: string) => {
      updateTodos((prev) => {
        const target = prev.find((t) => t.id === id);
        if (!target) return prev;
        const newCompleted = !target.completed;
        if (!target.parentId) {
          return prev.map((t) => {
            if (t.id === id) return { ...t, completed: newCompleted };
            if (t.parentId === id && newCompleted) return { ...t, completed: true };
            return t;
          });
        }
        return prev.map((t) =>
          t.id === id ? { ...t, completed: newCompleted } : t,
        );
      });
    },
    [updateTodos],
  );

  const deleteTodo = useCallback(
    (id: string) => {
      updateTodos(
        (prev) => {
          const target = prev.find((t) => t.id === id);
          if (!target) return prev;
          if (!target.parentId) {
            return prev.filter((t) => t.id !== id && t.parentId !== id);
          }
          return prev.filter((t) => t.id !== id);
        },
        {
          deleted: (() => {
            const current = todosRef.current;
            const target = current.find((t) => t.id === id);
            if (!target) return [id];
            if (!target.parentId) {
              return [id, ...current.filter((t) => t.parentId === id).map((t) => t.id)];
            }
            return [id];
          })(),
        },
      );
    },
    [updateTodos],
  );

  const editTodo = useCallback(
    (id: string, text: string) => {
      updateTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, text } : t)),
      );
    },
    [updateTodos],
  );

  const editDescription = useCallback(
    (id: string, description: string | undefined) => {
      updateTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, description } : t)),
      );
    },
    [updateTodos],
  );

  const setFrog = useCallback(
    (id: string) => {
      updateTodos((prev) => {
        const target = prev.find((t) => t.id === id);
        if (!target) return prev;
        const newFrog = !target.isFrog;
        return prev.map((t) => {
          if (t.id === id) return { ...t, isFrog: newFrog };
          if (newFrog && t.isFrog) return { ...t, isFrog: false };
          return t;
        });
      });
    },
    [updateTodos],
  );

  const toggleSnooze = useCallback(
    (id: string) => {
      updateTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isSnoozed: !t.isSnoozed } : t)),
      );
    },
    [updateTodos],
  );

  const scheduleForToday = useCallback(
    (id: string) => {
      const today = new Date().toISOString().split("T")[0];
      updateTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, scheduledDate: today } : t)),
      );
    },
    [updateTodos],
  );

  const setScheduledDate = useCallback(
    (id: string, date: string | undefined) => {
      updateTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, scheduledDate: date } : t)),
      );
    },
    [updateTodos],
  );

  const addSubtask = useCallback(
    (parentId: string, text: string) => {
      const child: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
        order: Date.now(),
        parentId,
      };
      updateTodos(
        (prev) => {
          const result: Todo[] = [];
          let inserted = false;
          for (const t of prev) {
            result.push(t);
            if (!inserted && (t.id === parentId || t.parentId === parentId)) {
              const nextIdx = prev.indexOf(t) + 1;
              const next = prev[nextIdx];
              if (!next || (next.id !== parentId && next.parentId !== parentId)) {
                result.push(child);
                inserted = true;
              }
            }
          }
          if (!inserted) result.push(child);
          return result;
        },
        { changed: () => [child] },
      );
      if (userIdRef.current) {
        persistToFirestore(child);
      }
    },
    [updateTodos, persistToFirestore],
  );

  const reorderTodo = useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;
      updateTodos((prev) => {
        const blocks: Todo[][] = [];
        for (const t of prev) {
          if (!t.parentId) {
            blocks.push([t]);
          } else if (blocks.length > 0) {
            blocks[blocks.length - 1]!.push(t);
          }
        }

        const fromIdx = blocks.findIndex((b) => b[0]?.id === activeId);
        const toIdx = blocks.findIndex((b) => b[0]?.id === overId);
        if (fromIdx === -1 || toIdx === -1) return prev;

        const [moved] = blocks.splice(fromIdx, 1);
        blocks.splice(toIdx, 0, moved!);

        // Assign order based on position
        const flat = blocks.flat();
        const reordered = flat.map((t, i) => ({ ...t, order: i }));
        return reordered;
      });
    },
    [updateTodos],
  );

  return {
    todos,
    addTodos,
    addOcrTasks,
    toggleTodo,
    deleteTodo,
    editTodo,
    editDescription,
    setFrog,
    toggleSnooze,
    scheduleForToday,
    setScheduledDate,
    addSubtask,
    reorderTodo,
  };
}
