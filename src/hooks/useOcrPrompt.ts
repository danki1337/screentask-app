import { useState, useCallback } from "react";

const STORAGE_KEY = "screentask-ocr-prompt";
const ENABLED_KEY = "screentask-ocr-prompt-enabled";

export function useOcrPrompt() {
  const [ocrPrompt, setOcrPromptState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  });

  const [ocrPromptEnabled, setOcrPromptEnabledState] = useState<boolean>(() => {
    return localStorage.getItem(ENABLED_KEY) === "true";
  });

  const setOcrPrompt = useCallback((prompt: string) => {
    localStorage.setItem(STORAGE_KEY, prompt);
    setOcrPromptState(prompt);
  }, []);

  const setOcrPromptEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(ENABLED_KEY, String(enabled));
    setOcrPromptEnabledState(enabled);
  }, []);

  const clearOcrPrompt = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOcrPromptState("");
  }, []);

  return { ocrPrompt, setOcrPrompt, ocrPromptEnabled, setOcrPromptEnabled, clearOcrPrompt };
}
