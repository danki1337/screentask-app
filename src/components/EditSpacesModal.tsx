import { useState } from "react";
import {
  Button,
  Modal,
  type UseOverlayStateReturn,
} from "@heroui/react";
import type { Space } from "@/types";

function TrashIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M19.5 5.5L18.613 18.166C18.508 19.744 17.192 21 15.61 21H8.39C6.808 21 5.492 19.744 5.387 18.166L4.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 5.5H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 5.5V3.5C8.5 2.948 8.948 2.5 9.5 2.5H14.5C15.052 2.5 15.5 2.948 15.5 3.5V5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

interface EditSpacesModalProps {
  state: UseOverlayStateReturn;
  spaces: Space[];
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export function EditSpacesModal({
  state,
  spaces,
  onRename,
  onDelete,
}: EditSpacesModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const startEditing = (space: Space) => {
    setEditingId(space.id);
    setEditValue(space.name);
  };

  const commitEdit = () => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDelete(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <Modal state={state}>
      <Modal.Backdrop className="dark">
        <Modal.Container>
          <Modal.Dialog className="dark bg-zinc-900 border border-zinc-800 text-zinc-100 [&_.modal\_\_close-trigger]:text-zinc-400 [&_.modal\_\_close-trigger:hover]:text-zinc-200">
            <Modal.CloseTrigger />
            <Modal.Header className="border-b border-zinc-800 pb-4">
              <Modal.Heading className="text-zinc-100">Edit Spaces</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-1 -mx-1">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 group transition-colors"
                  >
                    {editingId === space.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setEditValue("");
                          }
                        }}
                        onBlur={commitEdit}
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 outline-none focus:border-zinc-500"
                      />
                    ) : (
                      <button
                        onClick={() => startEditing(space)}
                        className="cursor-pointer flex-1 text-left text-sm text-zinc-200 hover:text-zinc-100 transition-colors"
                      >
                        {space.name}
                      </button>
                    )}
                    {confirmDeleteId === space.id ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          onPress={() => handleDelete(space.id)}
                          className="cursor-pointer bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs px-2.5 h-7"
                        >
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onPress={() => setConfirmDeleteId(null)}
                          className="cursor-pointer text-zinc-500 hover:text-zinc-300 text-xs px-2 h-7"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(space.id)}
                        disabled={spaces.length <= 1}
                        className="cursor-pointer opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-500 disabled:hover:bg-transparent"
                      >
                        <TrashIcon size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Modal.Body>
            <Modal.Footer className="border-t border-zinc-800 pt-4">
              <div className="flex justify-end w-full">
                <Button
                  size="sm"
                  onPress={state.close}
                  className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Done
                </Button>
              </div>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
