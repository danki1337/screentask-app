import { useEffect } from "react";
import { useOverlayState } from "@heroui/react";
import { Agentation } from "agentation";
import { Header } from "./components/Header";
import { TodoList } from "./components/TodoList";
import { SettingsModal } from "./components/SettingsModal";
import { useClipboard } from "./hooks/useClipboard";
import { useTodos } from "./hooks/useTodos";
import { useApiKey } from "./hooks/useApiKey";

export default function App() {
  const { pastedImage, clearImage } = useClipboard();
  const { todos, addTodos, toggleTodo, deleteTodo, editTodo, reorderTodos } = useTodos();
  const { apiKey, setApiKey, clearApiKey, hasApiKey } = useApiKey();
  const settingsState = useOverlayState();

  useEffect(() => {
    if (!hasApiKey) {
      settingsState.open();
    }
  }, []);

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className="dark min-h-screen bg-[#0C0C0C] text-zinc-100 font-sans">
      <div className="max-w-xl mx-auto px-5 border-0">
        <Header
          onOpenSettings={settingsState.open}
          totalTodos={todos.length}
          completedTodos={completedCount}
        />
        <main className="pt-8 pb-16 flex flex-col gap-6">
          <TodoList
            todos={todos}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
            onEdit={editTodo}
            onReorder={reorderTodos}
            onAddTodo={(text) => addTodos([text])}
            pastedImage={pastedImage}
            clearImage={clearImage}
            onTasksExtracted={addTodos}
            apiKey={apiKey}
            onNoApiKey={settingsState.open}
          />
        </main>
      </div>
      <SettingsModal
        state={settingsState}
        apiKey={apiKey}
        onSave={setApiKey}
        onClear={clearApiKey}
      />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}
