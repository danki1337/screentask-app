import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Checkbox } from "@heroui/react";
import type { Todo } from "@/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

function PencilIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.2141 4.98239L17.6158 3.58063C18.39 2.80646 19.6452 2.80646 20.4194 3.58063C21.1935 4.3548 21.1935 5.60998 20.4194 6.38415L19.0176 7.78591M16.2141 4.98239L10.9802 10.2163C9.93493 11.2616 9.41226 11.7842 9.0363 12.4014C8.66034 13.0186 8.31292 14.1258 7.96549 15.2329C7.61807 16.34 8.6602 16.8627 9.76729 16.5152C10.8744 16.1678 11.9815 15.8204 12.5987 15.4444C13.2159 15.0685 13.7386 14.5458 14.7838 13.5005L19.0176 7.78591M16.2141 4.98239L19.0176 7.78591" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M21 12C21 16.2426 21 18.364 19.682 19.682C18.364 21 16.2426 21 12 21C7.75736 21 5.63604 21 4.31802 19.682C3 18.364 3 16.2426 3 12C3 7.75736 3 5.63604 4.31802 4.31802C5.63604 3 7.75736 3 12 3" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function TrashIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function EditableText({
  text,
  onSave,
  className,
  editTriggerRef,
}: {
  text: string;
  onSave: (newText: string) => void;
  className: string;
  editTriggerRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editTriggerRef) {
      editTriggerRef.current = () => setEditing(true);
    }
  }, [editTriggerRef]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== text) {
      onSave(trimmed);
    } else {
      setDraft(text);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(text);
    setEditing(false);
  };

  return (
    <AnimatePresence mode="wait">
      {editing ? (
        <motion.input
          key="input"
          ref={inputRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          onBlur={save}
          className="text-[15px] leading-relaxed bg-transparent outline-none text-zinc-100 flex-1 min-w-0 py-2.5"
        />
      ) : (
        <motion.span
          key="text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setEditing(true)}
          className={`${className} cursor-text`}
        >
          {text}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
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
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="group flex items-center gap-3 py-1 px-1 -mx-2 rounded-full hover:bg-white/[0.04] transition-colors duration-150 cursor-grab active:cursor-grabbing touch-none"
    >
      <div
        className="ml-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          isSelected={todo.completed}
          onChange={() => onToggle(todo.id)}
        >
          <Checkbox.Control className="rounded-full w-[26px] h-[26px] border-2 border-zinc-600 data-[selected=true]:border-fuchsia-500 data-[selected=true]:bg-fuchsia-500 data-[hovered=true]:border-fuchsia-400 transition-all duration-200">
            <Checkbox.Indicator className="text-white" />
          </Checkbox.Control>
        </Checkbox>
      </div>

      <EditableText
        text={todo.text}
        onSave={(newText) => onEdit(todo.id, newText)}
        className="text-[15px] leading-relaxed text-zinc-200 flex-1 min-w-0 py-2.5"
      />

      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mr-1 shrink-0">
        <Button
          size="sm"
          variant="ghost"
          onPress={() => onDelete(todo.id)}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          className="rounded-full text-red-400 hover:text-red-300 bg-red-500/0 hover:bg-red-500/15 gap-1.5 px-3"
          style={{ "--button-bg-hover": "rgba(239,68,68,0.15)", "--button-bg-pressed": "rgba(239,68,68,0.15)" } as React.CSSProperties}
        >
          <TrashIcon size={14} className="text-current" />
          Remove
        </Button>
      </div>
    </motion.div>
  );
}

export function CompletedTodoItem({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: TodoItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="group flex items-center gap-3 py-1 px-4 rounded-full hover:bg-white/[0.04] transition-colors duration-150"
    >
      <div className="shrink-0">
        <Checkbox
          isSelected={todo.completed}
          onChange={() => onToggle(todo.id)}
        >
          <Checkbox.Control className="rounded-full w-[26px] h-[26px] border-2 border-zinc-700 data-[selected=true]:border-zinc-600 data-[selected=true]:bg-zinc-600 data-[hovered=true]:border-zinc-500 transition-all duration-200">
            <Checkbox.Indicator className="text-white" />
          </Checkbox.Control>
        </Checkbox>
      </div>

      <EditableText
        text={todo.text}
        onSave={(newText) => onEdit(todo.id, newText)}
        className="text-[15px] leading-relaxed text-zinc-600 line-through flex-1 min-w-0 py-2.5"
      />

      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 mr-1">
        <Button
          size="sm"
          variant="ghost"
          onPress={() => onDelete(todo.id)}
          className="rounded-full text-red-400 hover:text-red-300 bg-red-500/0 hover:bg-red-500/15 gap-1.5 px-3"
          style={{ "--button-bg-hover": "rgba(239,68,68,0.15)", "--button-bg-pressed": "rgba(239,68,68,0.15)" } as React.CSSProperties}
        >
          <TrashIcon size={14} className="text-current" />
          Remove
        </Button>
      </div>
    </motion.div>
  );
}
