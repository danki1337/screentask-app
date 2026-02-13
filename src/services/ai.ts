import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AnalysisResult } from "@/types";

export const DEFAULT_OCR_PROMPT = `Analyze this screenshot and extract all actionable tasks, to-do items, or action items visible in it. Look for:
- Checklist items or bullet points
- Action items from messages, emails, or chat
- Tasks mentioned in project boards, calendars, or notes
- Any other clearly identifiable things a person needs to do

If no actionable tasks are found, still try to infer useful tasks from the context of what's shown.`;

const SYSTEM_SUFFIX = `\n\nReturn ONLY valid JSON in this exact format:
{
  "source": "<brief description of where these tasks come from, e.g. 'Slack — Sarah', 'Jira Board', 'Email from Mike'>",
  "mainTask": "<the overarching task or goal>",
  "subtasks": ["<specific action item 1>", "<specific action item 2>"]
}

The "source" should describe the app or context visible in the screenshot (e.g. "Slack — John", "Jira Board", "Email", "Meeting Notes").
The "mainTask" should be a concise summary of the overall goal.
The "subtasks" should be the individual actionable items extracted.
If there's only one task and no meaningful subtasks, return an empty subtasks array.`;

export async function analyzeScreenshot(
  base64Image: string,
  mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif",
  apiKey: string,
  customPrompt?: string,
): Promise<AnalysisResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = (customPrompt?.trim() || DEFAULT_OCR_PROMPT) + SYSTEM_SUFFIX;

  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: mediaType || "image/png",
        data: base64Image,
      },
    },
    { text: prompt },
  ]);

  const raw = result.response.text().trim();
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { source: "", mainTask: "", subtasks: [], error: "Could not parse tasks from response" };
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    source: parsed.source || "",
    mainTask: parsed.mainTask || "",
    subtasks: Array.isArray(parsed.subtasks) ? parsed.subtasks : [],
  };
}
