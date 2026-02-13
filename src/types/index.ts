export interface Space {
  id: string;
  name: string;
  createdAt: number;
  order: number;
}

export interface Todo {
  id: string;
  text: string;
  description?: string;
  completed: boolean;
  createdAt: number;
  parentId?: string;
  source?: string;
  isFrog?: boolean;
  scheduledDate?: string;
  order?: number;
  spaceId?: string;
}

export interface AnalysisResult {
  source: string;
  mainTask: string;
  subtasks: string[];
  error?: string;
}

export type FocusTab = "now" | "planning";
