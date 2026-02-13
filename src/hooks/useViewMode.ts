import { useState } from "react";
import type { FocusTab } from "@/types";

export function useViewMode() {
  const [focusTab, setFocusTab] = useState<FocusTab>("now");
  return { focusTab, setFocusTab };
}
