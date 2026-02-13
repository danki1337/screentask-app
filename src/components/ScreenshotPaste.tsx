import { useState } from "react";
import { Button, Card, CloseButton, Spinner } from "@heroui/react";
import { analyzeScreenshot } from "@/services/ai";
import type { ClipboardImage } from "@/hooks/useClipboard";

interface ScreenshotPasteProps {
  pastedImage: ClipboardImage | null;
  clearImage: () => void;
  onTasksExtracted: (tasks: string[]) => void;
  apiKey: string;
  onNoApiKey: () => void;
}

export function ScreenshotPaste({
  pastedImage,
  clearImage,
  onTasksExtracted,
  apiKey,
  onNoApiKey,
}: ScreenshotPasteProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!apiKey) {
      onNoApiKey();
      return;
    }
    if (!pastedImage) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeScreenshot(
        pastedImage.base64,
        pastedImage.mediaType,
        apiKey,
      );
      if (result.error) {
        setError(result.error);
      } else if (!result.mainTask) {
        setError("No actionable tasks found in this screenshot.");
      } else {
        onTasksExtracted([result.mainTask, ...result.subtasks]);
        clearImage();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to analyze screenshot";
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!pastedImage) {
    return null;
  }

  return (
    <Card className="bg-zinc-900 border border-zinc-800">
      <Card.Content>
        <div className="flex flex-col gap-4">
          <div className="relative group">
            <img
              src={pastedImage.dataUrl}
              alt="Pasted screenshot"
              className="max-h-64 w-full object-contain rounded-lg bg-zinc-950"
            />
            {!isAnalyzing && (
              <CloseButton
                className="absolute top-2 right-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity scale-75"
                aria-label="Remove screenshot"
                onPress={clearImage}
              />
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg gap-3">
                <Spinner className="text-white" />
                <span className="text-sm text-white">
                  Analyzing screenshot...
                </span>
              </div>
            )}
          </div>
          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onPress={clearImage}
              isDisabled={isAnalyzing}
            >
              Cancel
            </Button>
            <Button size="sm" onPress={handleAnalyze} isDisabled={isAnalyzing}>
              {isAnalyzing ? "Analyzing..." : "Extract Tasks"}
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
