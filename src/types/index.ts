export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface AnalysisResult {
  tasks: string[];
  error?: string;
}
