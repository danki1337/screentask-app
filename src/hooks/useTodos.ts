import { useState, useCallback, useEffect, useRef } from "react";
import {
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/services/firebase";
import type { Todo } from "@/types";

function todosCollection(uid: string) {
  return collection(db, "users", uid, "todos");
}

function todoDoc(uid: string, todoId: string) {
  return doc(db, "users", uid, "todos", todoId);
}

export function useTodos(userId: string | null = null, spaceId: string | null = null) {
  const [todos, setTodos] = useState<Todo[]>([]);

  const todosRef = useRef(todos);
  todosRef.current = todos;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const spaceIdRef = useRef(spaceId);
  spaceIdRef.current = spaceId;

  // Clear todos when user logs out or space changes
  useEffect(() => {
    if (!userId || !spaceId) {
      setTodos([]);
    }
  }, [userId, spaceId]);

  // --- Firestore subscription ---
  useEffect(() => {
    if (!userId || !spaceId) return;

    const q = query(
      todosCollection(userId),
      where("spaceId", "==", spaceId),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreTodos: Todo[] = snapshot.docs.map((d) => d.data() as Todo);
        firestoreTodos.sort((a, b) => (a.order ?? a.createdAt) - (b.order ?? b.createdAt));
        setTodos(firestoreTodos);
      },
      (error) => {
        console.error("Todos subscription error:", error);
      },
    );

    return unsubscribe;
  }, [userId, spaceId]);

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
            setDoc(todoDoc(uid, t.id), t);
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
        setDoc(todoDoc(uid, todo.id), clean);
      });
    },
    [],
  );

  const deleteFromFirestore = useCallback((id: string) => {
    const uid = userIdRef.current;
    if (!uid) return;
    deleteDoc(todoDoc(uid, id));
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
      const currentSpaceId = spaceIdRef.current;
      const newTodos: Todo[] = texts.map((text, i) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: now + i,
        order: now + i,
        ...(currentSpaceId ? { spaceId: currentSpaceId } : {}),
        ...(i === 0 && description ? { description } : {}),
      }));
      updateTodos(
        (prev) => [...newTodos, ...prev],
        {
          changed: () =>
            // All new todos plus re-ordered existing ones
            newTodos,
        },
      );
      // Persist new todos + order update for existing
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
      const currentSpaceId = spaceIdRef.current;
      const spaceFields = currentSpaceId ? { spaceId: currentSpaceId } : {};
      const parent: Todo = {
        id: parentId,
        text: mainTask,
        completed: false,
        createdAt: now,
        order: now,
        source,
        ...spaceFields,
      };
      const children: Todo[] = subtasks.map((text, i) => ({
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: now + i + 1,
        order: now + i + 1,
        parentId,
        ...spaceFields,
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
      const currentSpaceId = spaceIdRef.current;
      const child: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
        order: Date.now(),
        parentId,
        ...(currentSpaceId ? { spaceId: currentSpaceId } : {}),
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
    scheduleForToday,
    setScheduledDate,
    addSubtask,
    reorderTodo,
  };
}
