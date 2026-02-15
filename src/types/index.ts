export interface Todo {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  parentId?: string;
  source?: string;
  isFrog?: boolean;
  isSnoozed?: boolean;
  scheduledDate?: string;
  order?: number;
}

export interface AnalysisResult {
  source: string;
  mainTask: string;
  subtasks: string[];
  error?: string;
}

export interface UserInfo {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export type FocusTab = "now" | "planning";
