import { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { Button, CloseButton, InputGroup, Spinner, TextField } from "@heroui/react";
import { TodoItem, CompletedTodoItem } from "./TodoItem";
import { analyzeScreenshot } from "@/services/ai";
import type { Todo } from "@/types";
import type { ClipboardImage } from "@/hooks/useClipboard";

function ArrowUpIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5.5V19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="M18 11C18 11 13.5811 5.00001 12 5C10.4188 4.99999 6 11 6 11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function ClipboardIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M7.5 3.5C5.9442 3.54667 5.01367 3.71984 4.37868 4.35982C3.5 5.24551 3.5 6.67281 3.5 9.52742V14.4726C3.5 17.3272 3.5 18.7545 4.37868 19.6402C5.25736 20.5259 6.67157 20.5259 9.5 20.5259H14.5C17.3284 20.5259 18.7426 20.5259 19.6213 19.6402C20.5 18.7545 20.5 17.3272 20.5 14.4726V9.52742C20.5 6.67281 20.5 5.24551 19.6213 4.35982C18.9863 3.71984 18.0558 3.54667 16.5 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M7.5 3.75C7.5 2.7835 8.2835 2 9.25 2H14.75C15.7165 2 16.5 2.7835 16.5 3.75C16.5 4.7165 15.7165 5.5 14.75 5.5H9.25C8.2835 5.5 7.5 4.7165 7.5 3.75Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function CheckCircleIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onReorder: (todos: Todo[]) => void;
  onAddTodo: (text: string) => void;
  pastedImage: ClipboardImage | null;
  clearImage: () => void;
  onTasksExtracted: (tasks: string[]) => void;
  apiKey: string;
  onNoApiKey: () => void;
}

export function TodoList({
  todos,
  onToggle,
  onDelete,
  onEdit,
  onReorder,
  onAddTodo,
  pastedImage,
  clearImage,
  onTasksExtracted,
  apiKey,
  onNoApiKey,
}: TodoListProps) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeTodos = todos.filter((t) => !t.completed);
  const completedTodos = todos.filter((t) => t.completed);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = todos.findIndex((t) => t.id === active.id);
      const newIndex = todos.findIndex((t) => t.id === over.id);
      onReorder(arrayMove(todos, oldIndex, newIndex));
    }
  };

  const handleAddTask = () => {
    const trimmed = newTask.trim();
    if (trimmed) {
      onAddTodo(trimmed);
      setNewTask("");
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
      );
      if (result.error) {
        setAnalysisError(result.error);
      } else if (result.tasks.length === 0) {
        setAnalysisError("No actionable tasks found in this screenshot.");
      } else {
        onTasksExtracted(result.tasks);
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      {/* Scrollable task area */}
      <div className="flex-1 pb-4">
        {/* Active tasks */}
        {activeTodos.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeTodos.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col">
                <AnimatePresence>
                  {activeTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={onToggle}
                      onDelete={onDelete}
                      onEdit={onEdit}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}

        <AnimatePresence>
          {activeTodos.length === 0 && completedTodos.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="py-12 text-center flex flex-col items-center gap-2 select-none"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <CheckCircleIcon size={32} className="text-fuchsia-500/60" />
              </motion.div>
              <p className="text-sm text-zinc-500">All done</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {todos.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="py-20 text-center flex flex-col items-center gap-2 select-none"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
              >
                <ClipboardIcon size={32} className="text-zinc-600" />
              </motion.div>
              <p className="text-base text-zinc-600">No tasks yet</p>
              <p className="text-sm text-zinc-700 mt-1">
                Add one below to get started
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Completed section */}
        {completedTodos.length > 0 && (
          <div className="mt-4">
            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="flex flex-col">
                    <AnimatePresence>
                      {completedTodos.map((todo) => (
                        <CompletedTodoItem
                          key={todo.id}
                          todo={todo}
                          onToggle={onToggle}
                          onDelete={onDelete}
                          onEdit={onEdit}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              className="flex justify-center py-2"
            >
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowCompleted(!showCompleted)}
                  className="rounded-full px-6 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-sm font-normal transition-colors"
                  style={{ "--button-bg": "rgba(39,39,42,0.6)", "--button-bg-hover": "#27272a", "--button-bg-pressed": "#27272a" } as React.CSSProperties}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={showCompleted ? "hide" : "show"}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.15 }}
                    >
                      {showCompleted ? "Hide completed" : `${completedTodos.length} of ${todos.length} completed`}
                    </motion.span>
                  </AnimatePresence>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Bottom-attached input — chat-style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
        className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-[#0C0C0C] from-80% to-transparent"
      >
        <div className={`border border-zinc-800 hover:border-zinc-700 focus-within:border-fuchsia-500/50 bg-zinc-900/80 backdrop-blur-sm transition-colors overflow-hidden ${pastedImage ? "rounded-3xl" : "rounded-full"}`}>
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
                        className="absolute top-2 right-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75"
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
          <TextField
            fullWidth
            aria-label="Add a task"
            name="new-task"
          >
            <InputGroup fullWidth className="border-0 bg-transparent py-1.5">
              <InputGroup.Input
                ref={inputRef}
                autoFocus
                placeholder={pastedImage ? "Add a task or extract from screenshot..." : "Add a task..."}
                value={newTask}
                className="px-5 text-[15px] text-zinc-200 placeholder:text-zinc-600"
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
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
            </InputGroup>
          </TextField>
        </div>
      </motion.div>
    </div>
  );
}
