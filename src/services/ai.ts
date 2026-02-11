import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult } from "@/types";

export async function analyzeScreenshot(
  base64Image: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  apiKey: string,
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType || "image/png",
        data: base64Image,
      },
    },
    {
      text: `Analyze this screenshot and extract all actionable tasks, to-do items, or action items visible in it. Look for:
- Checklist items or bullet points
- Action items from messages, emails, or chat
- Tasks mentioned in project boards, calendars, or notes
- Any other clearly identifiable things a person needs to do

Return ONLY a JSON array of strings, where each string is a concise, actionable task.
Example: ["Review pull request #42", "Schedule meeting with design team", "Fix login page bug"]

If no actionable tasks are found, still try to infer useful tasks from the context of what's shown.
Return an empty array [] only if the image is completely unrelated to any work or tasks.`,
    },
  ]);

  const raw = result.response.text().trim();
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return { tasks: [], error: "Could not parse tasks from response" };
  }

  const tasks: string[] = JSON.parse(jsonMatch[0]);
  return { tasks };
}
