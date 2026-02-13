import { useEffect } from "react";
import { useOverlayState } from "@heroui/react";
import { Agentation } from "agentation";
import { Header } from "./components/Header";
import { TodoList } from "./components/TodoList";
import { SettingsModal } from "./components/SettingsModal";
import { EditSpacesModal } from "./components/EditSpacesModal";
import { useClipboard } from "./hooks/useClipboard";
import { useTodos } from "./hooks/useTodos";
import { useSpaces } from "./hooks/useSpaces";
import { useAuth } from "./hooks/useAuth";
import { useApiKey } from "./hooks/useApiKey";
import { useOcrPrompt } from "./hooks/useOcrPrompt";
import { useViewMode } from "./hooks/useViewMode";
import { DEFAULT_OCR_PROMPT } from "./services/ai";

export default function App() {
  const { pastedImage, clearImage } = useClipboard();
  const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
  const {
    spaces,
    activeSpaceId,
    setActiveSpaceId,
    createSpace,
    renameSpace,
    deleteSpace,
  } = useSpaces(user?.uid ?? null);
  const {
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
  } = useTodos(user?.uid ?? null, activeSpaceId);
  const { apiKey, setApiKey } = useApiKey();
  const { ocrPrompt, setOcrPrompt, ocrPromptEnabled, setOcrPromptEnabled } = useOcrPrompt();
  const { focusTab, setFocusTab } = useViewMode();
  const settingsState = useOverlayState();
  const editSpacesState = useOverlayState();

  // Prompt login on first open if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      signInWithGoogle();
    }
  }, [authLoading]);

  return (
    <div className="dark min-h-screen bg-[#0C0C0C] text-zinc-100 font-sans font-medium">
      <div className="max-w-xl mx-auto px-5 border-0">
        <Header
          onOpenSettings={settingsState.open}
          focusTab={focusTab}
          onFocusTabChange={setFocusTab}
          user={user}
          onSignIn={signInWithGoogle}
          onSignOut={logout}
          authLoading={authLoading}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
          onSwitchSpace={setActiveSpaceId}
          onCreateSpace={createSpace}
          onEditSpaces={editSpacesState.open}
        />
        <main className="pt-8 pb-16 flex flex-col gap-6">
          {authLoading ? (
            <div className="py-24 flex justify-center">
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
            </div>
          ) : !user ? (
            <div className="py-20 text-center flex flex-col items-center gap-4 select-none">
              <span className="text-4xl">📋</span>
              <p className="text-zinc-300 text-lg font-medium">Welcome to ScreenTask</p>
              <p className="text-sm text-zinc-500 max-w-xs">
                Sign in with Google to access your tasks across all your devices.
              </p>
              <button
                onClick={signInWithGoogle}
                className="mt-3 inline-flex items-center gap-2.5 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium rounded-full border border-zinc-800 transition-colors"
              >
                <svg width={16} height={16} viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Login with Google
              </button>
            </div>
          ) : (
            <TodoList
              todos={todos}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onEdit={editTodo}
              onEditDescription={editDescription}
              onSetFrog={setFrog}
              onAddTodo={(text, desc) => addTodos([text], desc)}
              onAddSubtask={addSubtask}
              onOcrTasks={addOcrTasks}
              onScheduleForToday={scheduleForToday}
              onUnschedule={(id) => setScheduledDate(id, undefined)}
              onReorderTodo={reorderTodo}
              pastedImage={pastedImage}
              clearImage={clearImage}
              apiKey={apiKey}
              ocrPrompt={ocrPromptEnabled ? ocrPrompt : ""}
              onNoApiKey={settingsState.open}
              focusTab={focusTab}
              onFocusTabChange={setFocusTab}
            />
          )}
        </main>
      </div>
      <SettingsModal
        state={settingsState}
        apiKey={apiKey}
        onSave={setApiKey}
        ocrPrompt={ocrPrompt}
        ocrPromptEnabled={ocrPromptEnabled}
        defaultOcrPrompt={DEFAULT_OCR_PROMPT}
        onSaveOcrPrompt={setOcrPrompt}
        onSetOcrPromptEnabled={setOcrPromptEnabled}
      />
      <EditSpacesModal
        state={editSpacesState}
        spaces={spaces}
        onRename={renameSpace}
        onDelete={deleteSpace}
      />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}
