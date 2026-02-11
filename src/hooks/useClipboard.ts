import { useEffect, useCallback, useState } from "react";

export interface ClipboardImage {
  base64: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  dataUrl: string;
}

export function useClipboard() {
  const [pastedImage, setPastedImage] = useState<ClipboardImage | null>(null);

  const clearImage = useCallback(() => {
    setPastedImage(null);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) continue;

          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1]!;
            const mediaType = (item.type || "image/png") as ClipboardImage["mediaType"];
            setPastedImage({ base64, mediaType, dataUrl });
          };
          reader.readAsDataURL(blob);
          break;
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return { pastedImage, clearImage };
}
