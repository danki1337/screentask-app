import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TodoItem, CompletedTodoItem } from "./TodoItem";
import type { Todo, FocusTab } from "@/types";

function InlineSubtaskInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (text: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
      setValue("");
    } else {
      onCancel();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 py-2 px-1 -mx-2 ml-6">
        <div className="shrink-0 ml-2 w-5 flex items-center justify-center text-zinc-700">
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <path d="M5 6V8.5C5 11.8137 7.68629 14.5 11 14.5H19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            <path d="M15 10.5L19 14.5L15 18.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </div>
        <div className="shrink-0 w-[22px] h-[22px]">
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-zinc-700">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
          </svg>
        </div>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") onCancel();
          }}
          onBlur={handleSubmit}
          placeholder="Add subtask..."
          className="flex-1 min-w-0 text-[14px] leading-relaxed bg-transparent outline-none text-zinc-200 placeholder:text-zinc-600"
        />
      </div>
    </motion.div>
  );
}

interface FocusModeProps {
  todos: Todo[];
  childrenByParent: Map<string, Todo[]>;
  completingIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDescription: (id: string, description: string | undefined) => void;
  onSetFrog: (id: string) => void;
  onScheduleForToday: (id: string) => void;
  onUnschedule: (id: string) => void;
  onReorderTodo: (activeId: string, overId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  focusTab: FocusTab;
  onFocusTabChange: (tab: FocusTab) => void;
}

export function FocusMode({
  todos,
  childrenByParent,
  completingIds,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  onSetFrog,
  onScheduleForToday,
  onUnschedule,
  onReorderTodo,
  onAddSubtask,
  focusTab,
  onFocusTabChange,
}: FocusModeProps) {
  const today = new Date().toISOString().split("T")[0] ?? "";

  const { todayTasks, allActiveTasks, completedTodos, completedToday } = useMemo(() => {
    const topLevel = todos.filter((t) => !t.parentId);

    const todayActive = topLevel.filter(
      (t) => !t.completed && (t.scheduledDate === today || t.isFrog),
    );
    todayActive.sort((a, b) => {
      if (a.isFrog && !b.isFrog) return -1;
      if (!a.isFrog && b.isFrog) return 1;
      return 0;
    });

    const todayDone = topLevel.filter(
      (t) => t.completed && (t.scheduledDate === today || t.isFrog),
    );

    const allActive = topLevel.filter((t) => !t.completed);
    const allCompleted = topLevel.filter((t) => t.completed);

    return {
      todayTasks: todayActive,
      allActiveTasks: allActive,
      completedTodos: allCompleted,
      completedToday: todayDone.length,
    };
  }, [todos, today]);

  const totalToday = todayTasks.length + completedToday;
  const progressPct = totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
  const currentTask = todayTasks[0];

  // Default to Planning on mount if no tasks for today
  const hasDefaulted = useRef(false);
  useEffect(() => {
    if (!hasDefaulted.current && totalToday === 0 && focusTab === "now") {
      hasDefaulted.current = true;
      onFocusTabChange("planning");
    }
  }, [totalToday, focusTab, onFocusTabChange]);

  return (
    <AnimatePresence mode="wait">
      {focusTab === "now" ? (
        <motion.div
          key="now"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
        >
          <NowTab
            currentTask={currentTask}
            childrenByParent={childrenByParent}
            completingIds={completingIds}
            completedToday={completedToday}
            totalToday={totalToday}
            progressPct={progressPct}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onEditDescription={onEditDescription}
            onSetFrog={onSetFrog}
            onAddSubtask={onAddSubtask}
            onSwitchToPlanning={() => onFocusTabChange("planning")}
          />
        </motion.div>
      ) : (
        <motion.div
          key="planning"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PlanningTab
            tasks={allActiveTasks}
            completedTodos={completedTodos}
            today={today}
            childrenByParent={childrenByParent}
            completingIds={completingIds}
            onToggle={onToggle}
            onDelete={onDelete}
            onEdit={onEdit}
            onEditDescription={onEditDescription}
            onSetFrog={onSetFrog}
            onScheduleForToday={onScheduleForToday}
            onUnschedule={onUnschedule}
            onReorderTodo={onReorderTodo}
            onAddSubtask={onAddSubtask}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function NowTab({
  currentTask,
  childrenByParent,
  completingIds,
  completedToday,
  totalToday,
  progressPct,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  onSetFrog,
  onAddSubtask,
  onSwitchToPlanning,
}: {
  currentTask: Todo | undefined;
  childrenByParent: Map<string, Todo[]>;
  completingIds: Set<string>;
  completedToday: number;
  totalToday: number;
  progressPct: number;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDescription: (id: string, description: string | undefined) => void;
  onSetFrog: (id: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onSwitchToPlanning: () => void;
}) {
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);

  if (!currentTask) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3 select-none">
        {totalToday > 0 ? (
          <>
            <span className="text-4xl">🎉</span>
            <p className="text-zinc-300">All done for today!</p>
            <p className="text-sm text-zinc-500">{completedToday} task{completedToday !== 1 ? "s" : ""} completed</p>
          </>
        ) : (
          <>
            <span className="text-3xl">📋</span>
            <p className="text-zinc-400">No tasks for today</p>
            <button
              onClick={onSwitchToPlanning}
              className="text-sm text-fuchsia-400 hover:text-fuchsia-300 mt-1"
            >
              Switch to Planning to schedule tasks
            </button>
          </>
        )}
      </div>
    );
  }

  const children = childrenByParent.get(currentTask.id) || [];

  return (
    <div className="flex flex-col gap-5">
      {/* Progress bar */}
      {totalToday > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{completedToday} of {totalToday} done today</span>
            <span>{Math.round(progressPct)}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-fuchsia-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      )}

      {/* Current task */}
      <div>
        <TodoItem
          todo={currentTask}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onEditDescription={onEditDescription}
          onSetFrog={onSetFrog}
          onAddSubtask={() => setAddingSubtaskFor(currentTask.id)}
          completing={completingIds.has(currentTask.id)}
        />
        {children.length > 0 && (
          <div className="flex flex-col">
            {children.map((child) => (
              <TodoItem
                key={child.id}
                todo={child}
                onToggle={onToggle}
                onDelete={onDelete}
                onEdit={onEdit}
                onEditDescription={onEditDescription}
                isSubtask
                completing={completingIds.has(child.id)}
              />
            ))}
          </div>
        )}
        <AnimatePresence>
          {addingSubtaskFor === currentTask.id && (
            <InlineSubtaskInput
              onSubmit={(text) => {
                onAddSubtask(currentTask.id, text);
                setAddingSubtaskFor(null);
              }}
              onCancel={() => setAddingSubtaskFor(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SortableTodoGroup({
  todo,
  childrenByParent,
  completingIds,
  addingSubtaskFor,
  isPlanned,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  onSetFrog,
  onAddSubtask,
  onScheduleForToday,
  onUnschedule,
  onSetAddingSubtask,
}: {
  todo: Todo;
  childrenByParent: Map<string, Todo[]>;
  completingIds: Set<string>;
  addingSubtaskFor: string | null;
  isPlanned: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDescription: (id: string, description: string | undefined) => void;
  onSetFrog: (id: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
  onScheduleForToday?: (id: string) => void;
  onUnschedule?: (id: string) => void;
  onSetAddingSubtask: (id: string | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const children = childrenByParent.get(todo.id) || [];

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        todo={todo}
        onToggle={onToggle}
        onDelete={onDelete}
        onEdit={onEdit}
        onEditDescription={onEditDescription}
        onSetFrog={onSetFrog}
        onAddSubtask={() => onSetAddingSubtask(todo.id)}
        onScheduleForToday={isPlanned ? undefined : onScheduleForToday}
        onUnschedule={isPlanned ? onUnschedule : undefined}
        badge={isPlanned ? "Planned" : undefined}
        dragHandleProps={listeners}
        completing={completingIds.has(todo.id)}
      />
      {children.length > 0 && (
        <div className="flex flex-col">
          {children.map((child) => (
            <TodoItem
              key={child.id}
              todo={child}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onEditDescription={onEditDescription}
              isSubtask
              completing={completingIds.has(child.id)}
            />
          ))}
        </div>
      )}
      <AnimatePresence>
        {addingSubtaskFor === todo.id && (
          <InlineSubtaskInput
            onSubmit={(text) => {
              onAddSubtask(todo.id, text);
              onSetAddingSubtask(null);
            }}
            onCancel={() => onSetAddingSubtask(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanningTab({
  tasks,
  completedTodos,
  today,
  childrenByParent,
  completingIds,
  onToggle,
  onDelete,
  onEdit,
  onEditDescription,
  onSetFrog,
  onScheduleForToday,
  onUnschedule,
  onReorderTodo,
  onAddSubtask,
}: {
  tasks: Todo[];
  completedTodos: Todo[];
  today: string;
  childrenByParent: Map<string, Todo[]>;
  completingIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDescription: (id: string, description: string | undefined) => void;
  onSetFrog: (id: string) => void;
  onScheduleForToday: (id: string) => void;
  onUnschedule: (id: string) => void;
  onReorderTodo: (activeId: string, overId: string) => void;
  onAddSubtask: (parentId: string, text: string) => void;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [addingSubtaskFor, setAddingSubtaskFor] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Split tasks into groups: frog first, then planned, then rest
  const { frogTask, plannedTasks, otherTasks } = useMemo(() => {
    let frog: Todo | null = null;
    const planned: Todo[] = [];
    const other: Todo[] = [];

    for (const t of tasks) {
      if (t.isFrog) {
        frog = t;
      } else if (t.scheduledDate === today) {
        planned.push(t);
      } else {
        other.push(t);
      }
    }

    return { frogTask: frog, plannedTasks: planned, otherTasks: other };
  }, [tasks, today]);

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderTodo(active.id as string, over.id as string);
    }
  };

  if (tasks.length === 0 && completedTodos.length === 0) {
    return (
      <div className="py-16 text-center flex flex-col items-center gap-3 select-none">
        <span className="text-3xl">✅</span>
        <p className="text-zinc-400">No tasks yet</p>
        <p className="text-sm text-zinc-600">Add new tasks below or paste a screenshot</p>
      </div>
    );
  }

  const hasFrog = !!frogTask;
  const hasPlanned = plannedTasks.length > 0;
  const hasOther = otherTasks.length > 0;

  return (
    <div className="flex flex-col">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {/* Frog task — highest priority */}
          {frogTask && (
            <SortableTodoGroup
              todo={frogTask}
              childrenByParent={childrenByParent}
              completingIds={completingIds}
              addingSubtaskFor={addingSubtaskFor}
              isPlanned={frogTask.scheduledDate === today}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              onEditDescription={onEditDescription}
              onSetFrog={onSetFrog}
              onAddSubtask={onAddSubtask}
              onScheduleForToday={onScheduleForToday}
              onUnschedule={onUnschedule}
              onSetAddingSubtask={setAddingSubtaskFor}
            />
          )}

          {/* Planned tasks group */}
          {hasPlanned && (
            <>
              {hasFrog && (
                <div className="border-t border-dashed border-zinc-800 mx-4 my-1" />
              )}
              {plannedTasks.map((todo, i) => (
                <div key={todo.id}>
                  {i > 0 && (
                    <div className="border-t border-dashed border-zinc-800 mx-4 my-1" />
                  )}
                  <SortableTodoGroup
                    todo={todo}
                    childrenByParent={childrenByParent}
                    completingIds={completingIds}
                    addingSubtaskFor={addingSubtaskFor}
                    isPlanned
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onEditDescription={onEditDescription}
                    onSetFrog={onSetFrog}
                    onAddSubtask={onAddSubtask}
                    onScheduleForToday={onScheduleForToday}
                    onUnschedule={onUnschedule}
                    onSetAddingSubtask={setAddingSubtaskFor}
                  />
                </div>
              ))}
            </>
          )}

          {/* Other tasks */}
          {hasOther && (
            <>
              {(hasFrog || hasPlanned) && (
                <div className="flex items-center gap-3 mx-4 my-3">
                  <div className="flex-1 border-t border-zinc-800" />
                  <span className="text-[11px] text-zinc-600 uppercase tracking-wider">Backlog</span>
                  <div className="flex-1 border-t border-zinc-800" />
                </div>
              )}
              {otherTasks.map((todo, i) => (
                <div key={todo.id}>
                  {i > 0 && (
                    <div className="border-t border-dashed border-zinc-800 mx-4 my-1" />
                  )}
                  <SortableTodoGroup
                    todo={todo}
                    childrenByParent={childrenByParent}
                    completingIds={completingIds}
                    addingSubtaskFor={addingSubtaskFor}
                    isPlanned={false}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onEditDescription={onEditDescription}
                    onSetFrog={onSetFrog}
                    onAddSubtask={onAddSubtask}
                    onScheduleForToday={onScheduleForToday}
                    onSetAddingSubtask={setAddingSubtaskFor}
                  />
                </div>
              ))}
            </>
          )}
        </SortableContext>
      </DndContext>

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
                    {completedTodos.map((todo, index) => {
                      const children = childrenByParent.get(todo.id) || [];
                      return (
                        <div key={todo.id}>
                          {index > 0 && (
                            <div className="border-t border-dashed border-zinc-800 mx-4 my-1" />
                          )}
                          <CompletedTodoItem
                            todo={todo}
                            onToggle={onToggle}
                            onDelete={onDelete}
                            onEdit={onEdit}
                          />
                          {children.length > 0 && (
                            <div className="flex flex-col">
                              {children.map((child) => (
                                <CompletedTodoItem
                                  key={child.id}
                                  todo={child}
                                  onToggle={onToggle}
                                  onDelete={onDelete}
                                  onEdit={onEdit}
                                  isSubtask
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="flex justify-center py-2">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setShowCompleted(!showCompleted)}
                className="rounded-full px-6 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 text-sm"
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
                    {showCompleted ? "Hide completed" : `${completedTodos.length} completed`}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
