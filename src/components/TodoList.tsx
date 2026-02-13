import { useState, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, CloseButton, Spinner } from "@heroui/react";
import { FocusMode } from "./FocusMode";
import { analyzeScreenshot } from "@/services/ai";
import type { Todo, FocusTab } from "@/types";
import type { ClipboardImage } from "@/hooks/useClipboard";

function ArrowUpIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5.5V19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M18 11C18 11 13.5811 5.00001 12 5C10.4188 4.99999 6 11 6 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDescription: (id: string, description: string | undefined) => void;
  onSetFrog: (id: string) => void;
  onAddTodo: (text: string, description?: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onOcrTasks: (source: string, mainTask: string, subtasks: string[]) => void;
  onScheduleForToday: (id: string) => void;
  onUnschedule: (id: string) => void;
  onReorderTodo: (activeId: string, overId: string) => void;
  pastedImage: ClipboardImage | null;
  clearImage: () => void;
  apiKey: string;
  ocrPrompt: string;
  onNoApiKey: () => void;
  focusTab: FocusTab;
  onFocusTabChange: (tab: FocusTab) => void;
}

export function TodoList({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  onSetFrog,
  onAddTodo,
  onAddSubtask,
  onOcrTasks,
  onScheduleForToday,
  onUnschedule,
  onReorderTodo,
  pastedImage,
  clearImage,
  apiKey,
  ocrPrompt,
  onNoApiKey,
  focusTab,
  onFocusTabChange,
}: TodoListProps) {
  const [newTask, setNewTask] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const completingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleToggleWithDelay = useCallback((id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;

    if (!todo.completed) {
      const idsToComplete = new Set<string>();
      idsToComplete.add(id);
      if (!todo.parentId) {
        for (const t of todos) {
          if (t.parentId === id && !t.completed) idsToComplete.add(t.id);
        }
      }

      setCompletingIds((prev) => {
        const next = new Set(prev);
        for (const cid of idsToComplete) next.add(cid);
        return next;
      });

      const timer = setTimeout(() => {
        onToggle(id);
        setCompletingIds((prev) => {
          const next = new Set(prev);
          for (const cid of idsToComplete) next.delete(cid);
          return next;
        });
        completingTimers.current.delete(id);
      }, 800);

      completingTimers.current.set(id, timer);
    } else {
      onToggle(id);
    }
  }, [todos, onToggle]);

  const childrenByParent = useMemo(() => {
    const childMap = new Map<string, Todo[]>();
    for (const todo of todos) {
      if (todo.parentId) {
        const siblings = childMap.get(todo.parentId) || [];
        siblings.push(todo);
        childMap.set(todo.parentId, siblings);
      }
    }
    return childMap;
  }, [todos]);

  const handleAddTask = () => {
    const trimmed = newTask.trim();
    if (trimmed) {
      const lines = trimmed.split("\n");
      const title = lines[0]!.trim();
      const desc = lines.slice(1).join("\n").trim() || undefined;
      onAddTodo(title, desc);
      setNewTask("");
      // Reset textarea height after clearing
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
      inputRef.current?.focus();
    }
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      onNoApiKey();
      return;
    }
    if (!pastedImage) return;

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeScreenshot(
        pastedImage.base64,
        pastedImage.mediaType,
        apiKey,
        ocrPrompt,
      );
      if (result.error) {
        setAnalysisError(result.error);
      } else if (!result.mainTask) {
        setAnalysisError("No actionable tasks found in this screenshot.");
      } else {
        onOcrTasks(result.source, result.mainTask, result.subtasks);
        clearImage();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to analyze screenshot";
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const inputBar = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
      className="sticky bottom-0 pb-2 bg-gradient-to-t from-[#0C0C0C] from-80% to-transparent"
    >
      <div
        className="pt-[20vh] -mt-[20vh] cursor-text"
        onClick={() => inputRef.current?.focus()}
      />
      <div className={`border border-fuchsia-500/50 bg-zinc-900/80 backdrop-blur-sm overflow-hidden ${pastedImage ? "rounded-3xl" : "rounded-full"}`}>
        {/* Screenshot preview inside input container */}
        <AnimatePresence>
          {pastedImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 pb-0">
                <div className="relative group">
                  <img
                    src={pastedImage.dataUrl}
                    alt="Pasted screenshot"
                    className="max-h-48 w-full object-contain rounded-lg bg-zinc-950"
                  />
                  {!isAnalyzing && (
                    <CloseButton
                      className="absolute top-2 right-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 scale-75"
                      aria-label="Remove screenshot"
                      onPress={clearImage}
                    />
                  )}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg gap-3">
                      <Spinner className="text-white" />
                      <span className="text-sm text-white">Analyzing screenshot...</span>
                    </div>
                  )}
                </div>
                {analysisError && (
                  <p className="text-red-400 text-xs mt-2 bg-red-950/30 px-3 py-1.5 rounded-lg">
                    {analysisError}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-0 py-1.5 px-1">
            <textarea
              ref={inputRef}
              autoFocus
              rows={1}
              placeholder={pastedImage ? "Add a task or extract from screenshot..." : "Add a task..."}
              value={newTask}
              className="flex-1 bg-transparent resize-none px-4 py-2 text-[15px] text-zinc-200 placeholder:text-zinc-600 outline-none leading-relaxed"
              onChange={(e) => {
                setNewTask(e.target.value);
                // Auto-resize
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAddTask();
                }
              }}
            />
            <div className="flex items-center gap-1.5 pr-2">
              <AnimatePresence>
                {pastedImage && !isAnalyzing && (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      size="sm"
                      onPress={handleAnalyze}
                      aria-label="Extract tasks from screenshot"
                      className="rounded-full bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3"
                    >
                      Extract Tasks
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {newTask.trim() && !pastedImage && (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(4px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(4px)" }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button
                      size="sm"
                      onPress={handleAddTask}
                      aria-label="Add task"
                      className="rounded-full bg-fuchsia-500 hover:bg-fuchsia-400 text-white gap-1.5 px-3"
                    >
                      <ArrowUpIcon size={14} className="text-current" />
                      Add task
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 pb-4">
        <FocusMode
          todos={todos}
          childrenByParent={childrenByParent}
          completingIds={completingIds}
          onToggle={handleToggleWithDelay}
          onDelete={onDelete}
          onEdit={onEdit}
          onEditDescription={onEditDescription}
          onSetFrog={onSetFrog}
          onScheduleForToday={onScheduleForToday}
          onUnschedule={onUnschedule}
          onReorderTodo={onReorderTodo}
          onAddSubtask={onAddSubtask}
          focusTab={focusTab}
          onFocusTabChange={onFocusTabChange}
        />
      </div>
      {inputBar}
    </div>
  );
}
