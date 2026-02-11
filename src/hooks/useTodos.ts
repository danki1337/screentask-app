import { useState, useCallback, useEffect } from "react";
import type { Todo } from "@/types";

const STORAGE_KEY = "screentask-todos";

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Todo[]) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const addTodos = useCallback((texts: string[]) => {
    const newTodos: Todo[] = texts.map((text) => ({
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: Date.now(),
    }));
    setTodos((prev) => [...newTodos, ...prev]);
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t)),
    );
  }, []);

  const reorderTodos = useCallback((reordered: Todo[]) => {
    setTodos(reordered);
  }, []);

  return { todos, addTodos, toggleTodo, deleteTodo, editTodo, reorderTodos };
}
