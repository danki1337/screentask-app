import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import type { Todo } from "@/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onEditDescription?: (id: string, description: string | undefined) => void;
  onSetFrog?: (id: string) => void;
  onAddSubtask?: (parentId: string) => void;
  onScheduleForToday?: (id: string) => void;
  onUnschedule?: (id: string) => void;
  badge?: string;
  dragHandleProps?: Record<string, unknown>;
  isSubtask?: boolean;
  completing?: boolean;
}

function TrashIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
}

function PlusIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 4V20M4 12H20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function CalendarPlusIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 2V4M6 2V4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M3 8H21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M2.5 12.243C2.5 7.88 2.5 5.699 3.793 4.349C5.086 3 7.143 3 11.257 3H12.743C16.857 3 18.914 3 20.207 4.349C21.5 5.699 21.5 7.88 21.5 12.243V12.757C21.5 17.12 21.5 19.301 20.207 20.651C18.914 22 16.857 22 12.743 22H11.257C7.143 22 5.086 22 3.793 20.651C2.5 19.301 2.5 17.12 2.5 12.757V12.243Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M12 11V17M15 14H9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function CalendarRemoveIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 2V4M6 2V4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M3 8H21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M2.5 12.243C2.5 7.88 2.5 5.699 3.793 4.349C5.086 3 7.143 3 11.257 3H12.743C16.857 3 18.914 3 20.207 4.349C21.5 5.699 21.5 7.88 21.5 12.243V12.757C21.5 17.12 21.5 19.301 20.207 20.651C18.914 22 16.857 22 12.743 22H11.257C7.143 22 5.086 22 3.793 20.651C2.5 19.301 2.5 17.12 2.5 12.757V12.243Z" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M14.5 11.5L9.5 16.5M9.5 11.5L14.5 16.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function GripIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="5" r="1.5" fill="currentColor" />
      <circle cx="15" cy="5" r="1.5" fill="currentColor" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <circle cx="9" cy="19" r="1.5" fill="currentColor" />
      <circle cx="15" cy="19" r="1.5" fill="currentColor" />
    </svg>
  );
}

function SubtaskArrow() {
  return (
    <div className="shrink-0 ml-2 w-5 flex items-center justify-center text-zinc-700">
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <path d="M5 6V8.5C5 11.8137 7.68629 14.5 11 14.5H19" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M15 10.5L19 14.5L15 18.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </div>
  );
}

const URL_REGEX = /https?:\/\/[^\s<>]+/g;

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function RichText({ text, className }: { text: string; className?: string }) {
  const parts: (string | { url: string })[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ url: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <span className={className}>
      {parts.map((part, i) =>
        typeof part === "string" ? (
          part
        ) : (
          <a
            key={i}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2 decoration-fuchsia-400/30 hover:decoration-fuchsia-300/50 transition-colors"
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none" className="shrink-0 inline -mt-0.5">
              <path d="M11 4H4V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 15L20 4M20 4H14M20 4V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {getDomain(part.url)}
          </a>
        ),
      )}
    </span>
  );
}

function EditableDescription({
  description,
  onSave,
  visuallyDone,
}: {
  description: string;
  onSave: (newDesc: string | undefined) => void;
  visuallyDone: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft when prop changes externally
  useEffect(() => {
    if (!editing) {
      setDraft(description);
    }
  }, [description, editing]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editing]);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed !== description) {
      onSave(trimmed || undefined);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") {
            setDraft(description);
            setEditing(false);
          }
        }}
        onBlur={save}
        className="w-full bg-transparent outline-none text-[13px] leading-relaxed text-zinc-500 resize-none"
      />
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      className={`text-[13px] leading-relaxed cursor-text whitespace-pre-wrap break-words overflow-hidden ${visuallyDone ? "text-zinc-700" : "text-zinc-500"}`}
    >
      <RichText text={description} />
    </div>
  );
}

function EditableText({
  text,
  onSave,
  className,
}: {
  text: string;
  onSave: (newText: string) => void;
  className: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync draft when prop changes externally
  useEffect(() => {
    if (!editing) {
      setDraft(text);
    }
  }, [text, editing]);

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
          className="text-[15px] leading-relaxed bg-transparent outline-none text-zinc-100 flex-1 min-w-0 py-0.5 w-full"
        />
      ) : (
        <motion.span
          key="text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className={`${className} cursor-text break-words`}
        >
          <RichText text={text} />
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function TodoItem({ todo, onToggle, onDelete, onEdit, onEditDescription, onSetFrog, onAddSubtask, onScheduleForToday, onUnschedule, badge, dragHandleProps, isSubtask, completing }: TodoItemProps) {
  const visuallyDone = todo.completed || completing;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: completing ? 0.5 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onToggle(todo.id)}
      className="group relative flex items-start gap-3 py-3 px-4 -mx-2 rounded-2xl hover:bg-white/[0.04] cursor-pointer"
    >
      {isSubtask && <SubtaskArrow />}

      {/* Checkbox - always circle */}
      <div className={`${isSubtask ? "" : "ml-1"} shrink-0 relative w-[22px] h-[22px] mt-0.5`}>
        {visuallyDone ? (
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-fuchsia-500">
            <circle cx="12" cy="12" r="10" fill="#d946ef" stroke="#d946ef" strokeWidth="1.5" />
            <path d="M8 12.5L10.5 15L16 9" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        ) : (
          <>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-zinc-600">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
              className="absolute inset-0 text-fuchsia-400 opacity-0 group-hover:opacity-100">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
          </>
        )}
      </div>

      {/* Frog indicator before text */}
      {todo.isFrog && !isSubtask && !todo.completed && (
        <span className="text-sm leading-none shrink-0">🐸</span>
      )}

      {/* Text + Description */}
      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <EditableText
          text={todo.text}
          onSave={(newText) => onEdit(todo.id, newText)}
          className={`text-[15px] leading-relaxed flex-1 min-w-0 ${
            visuallyDone ? "text-zinc-600 line-through" : "text-zinc-200"
          } ${isSubtask ? "text-[14px]" : ""}`}
        />
        {todo.description && onEditDescription && (
          <EditableDescription
            description={todo.description}
            onSave={(desc) => onEditDescription(todo.id, desc)}
            visuallyDone={!!visuallyDone}
          />
        )}
      </div>

      {/* Badge (e.g. "Planned") - always visible */}
      {badge && (
        <span className="shrink-0 text-xs bg-fuchsia-500/10 text-fuchsia-400 rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}

      {/* Drag handle - visible on hover, before the actions */}
      {dragHandleProps && (
        <div
          className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 p-1"
          onClick={(e) => e.stopPropagation()}
          {...dragHandleProps}
        >
          <GripIcon size={14} className="text-current" />
        </div>
      )}

      {/* Hover actions - absolutely positioned so text isn't cropped */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-gradient-to-r from-transparent via-[#161616] to-[#161616] pl-6 rounded-r-full"
        onClick={(e) => e.stopPropagation()}>
        {onScheduleForToday && !isSubtask && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => onScheduleForToday(todo.id)}
            className="w-8 h-8 min-w-8 rounded-full text-zinc-500 hover:text-blue-400 [transition:none]"
            style={{ "--button-bg-hover": "rgba(59,130,246,0.1)", "--button-bg-pressed": "rgba(59,130,246,0.1)" } as React.CSSProperties}
          >
            <CalendarPlusIcon size={14} className="text-current" />
          </Button>
        )}
        {onUnschedule && !isSubtask && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => onUnschedule(todo.id)}
            className="w-8 h-8 min-w-8 rounded-full text-zinc-500 hover:text-orange-400 [transition:none]"
            style={{ "--button-bg-hover": "rgba(251,146,60,0.1)", "--button-bg-pressed": "rgba(251,146,60,0.1)" } as React.CSSProperties}
          >
            <CalendarRemoveIcon size={14} className="text-current" />
          </Button>
        )}
        {onAddSubtask && !isSubtask && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => onAddSubtask(todo.id)}
            className="w-8 h-8 min-w-8 rounded-full text-zinc-500 hover:text-zinc-300 [transition:none]"
            style={{ "--button-bg-hover": "rgba(161,161,170,0.1)", "--button-bg-pressed": "rgba(161,161,170,0.1)" } as React.CSSProperties}
          >
            <PlusIcon size={12} className="text-current" />
          </Button>
        )}
        {onSetFrog && !isSubtask && (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            onPress={() => onSetFrog(todo.id)}
            className={`w-8 h-8 min-w-8 rounded-full [transition:none] ${todo.isFrog ? "text-green-400 hover:text-green-300" : "text-zinc-500 hover:text-zinc-300"}`}
            style={{ "--button-bg-hover": todo.isFrog ? "rgba(34,197,94,0.15)" : "rgba(161,161,170,0.1)", "--button-bg-pressed": todo.isFrog ? "rgba(34,197,94,0.15)" : "rgba(161,161,170,0.1)" } as React.CSSProperties}
          >
            🐸
          </Button>
        )}
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={() => onDelete(todo.id)}
          className="w-8 h-8 min-w-8 rounded-full text-red-400 hover:text-red-300 [transition:none]"
          style={{ "--button-bg-hover": "rgba(239,68,68,0.15)", "--button-bg-pressed": "rgba(239,68,68,0.15)" } as React.CSSProperties}
        >
          <TrashIcon size={14} className="text-current" />
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
  isSubtask,
}: TodoItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => onToggle(todo.id)}
      className="group relative flex items-start gap-3 py-3 px-4 rounded-2xl hover:bg-white/[0.04] cursor-pointer"
    >
      {isSubtask && <SubtaskArrow />}

      <div className="shrink-0 mt-0.5">
        <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-zinc-600">
          <circle cx="12" cy="12" r="10" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12.5L10.5 15L16 9" stroke="#27272a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </div>

      <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
        <EditableText
          text={todo.text}
          onSave={(newText) => onEdit(todo.id, newText)}
          className={`text-[15px] leading-relaxed text-zinc-600 line-through flex-1 min-w-0 ${isSubtask ? "text-[14px]" : ""}`}
        />
        {todo.description && (
          <div className="text-[13px] leading-relaxed text-zinc-700 whitespace-pre-wrap break-words overflow-hidden">
            <RichText text={todo.description} />
          </div>
        )}
      </div>

      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-[#161616] to-[#161616] pl-6 rounded-r-full"
        onClick={(e) => e.stopPropagation()}>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          onPress={() => onDelete(todo.id)}
          className="w-8 h-8 min-w-8 rounded-full text-red-400 hover:text-red-300 [transition:none]"
          style={{ "--button-bg-hover": "rgba(239,68,68,0.15)", "--button-bg-pressed": "rgba(239,68,68,0.15)" } as React.CSSProperties}
        >
          <TrashIcon size={14} className="text-current" />
        </Button>
      </div>
    </motion.div>
  );
}
