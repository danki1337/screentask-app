import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Space } from "@/types";

function ChevronDownIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon({ size = 14, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.293 2.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-13 13A1 1 0 018 21H4a1 1 0 01-1-1v-4a1 1 0 01.293-.707l13-13z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface SpaceSwitcherProps {
  spaces: Space[];
  activeSpaceId: string | null;
  onSwitchSpace: (id: string) => void;
  onCreateSpace: (name: string) => Promise<string | null>;
  onEditSpaces: () => void;
}

export function SpaceSwitcher({
  spaces,
  activeSpaceId,
  onSwitchSpace,
  onCreateSpace,
  onEditSpaces,
}: SpaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreatingNew(false);
        setNewName("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (creatingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creatingNew]);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  const handleCreateSpace = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const id = await onCreateSpace(trimmed);
    if (id) {
      onSwitchSpace(id);
    }
    setCreatingNew(false);
    setNewName("");
    setOpen(false);
  };

  if (spaces.length === 0) {
    return <div className="w-9" />;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-sm font-medium transition-colors select-none"
      >
        <span className="max-w-[120px] truncate">{activeSpace?.name ?? "Space"}</span>
        <ChevronDownIcon size={12} className="text-zinc-500 shrink-0" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-2 z-50 min-w-[200px] bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden py-1.5"
          >
            {/* Space list */}
            <div className="px-2 py-1">
              {spaces.map((space) => (
                <button
                  key={space.id}
                  onClick={() => {
                    onSwitchSpace(space.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-300 hover:bg-zinc-800/70 transition-colors"
                >
                  <span className="w-4 shrink-0">
                    {space.id === activeSpaceId && (
                      <CheckIcon size={14} className="text-fuchsia-400" />
                    )}
                  </span>
                  <span className="flex-1 truncate text-left">{space.name}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-zinc-800 mx-2" />

            <div className="px-2 py-1 flex items-center gap-1">
              <button
                onClick={() => setCreatingNew(true)}
                className="cursor-pointer flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/70 transition-colors"
              >
                <PlusIcon size={14} className="shrink-0" />
                New Space
              </button>
              <button
                onClick={() => {
                  onEditSpaces();
                  setOpen(false);
                }}
                className="cursor-pointer p-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/70 transition-colors"
              >
                <PencilIcon size={14} />
              </button>
            </div>

            {/* Inline new space input */}
            <AnimatePresence>
              {creatingNew && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.12 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateSpace();
                        if (e.key === "Escape") {
                          setCreatingNew(false);
                          setNewName("");
                        }
                      }}
                      placeholder="Space name..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
