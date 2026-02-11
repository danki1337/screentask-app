# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript type-check (`tsc -b`) then Vite production build
- `npm run preview` — Preview production build locally

No test runner or linter is configured.

## Tech Stack

- **React 19** + **TypeScript 5.6** (strict mode, noUnusedLocals/Parameters)
- **Vite 6** for bundling
- **HeroUI 3.0.0-beta.6** — component library (Button, Modal, Card, Spinner, Checkbox, Input)
- **Tailwind CSS 4.1** — utility classes, dark mode via `dark` class on root
- **@dnd-kit** — drag-and-drop for todo reordering
- **@google/generative-ai** — Gemini API calls run client-side (gemini-2.0-flash model with vision)

## Architecture

**App.tsx** is the root orchestrator — it owns all state via custom hooks and passes props/callbacks down to presentational components.

### Custom Hooks (src/hooks/)
- `useTodos` — CRUD + reorder for todos, persisted to localStorage (`screentask-todos`). Batch-adds todos via `addTodos`. All mutations use functional setState.
- `useApiKey` — Stores Google Gemini API key in localStorage (`screentask-gemini-key`). Exposes `apiKey`, `hasApiKey`, `setApiKey`, `clearApiKey`.
- `useClipboard` — Listens to document paste events, extracts images as base64 `ClipboardImage` objects.

### AI Service (src/services/ai.ts)
- `analyzeScreenshot(base64, mediaType, apiKey)` → `AnalysisResult`
- Uses Google Gemini `gemini-2.0-flash` model with vision to extract tasks from pasted screenshots
- Returns `{ tasks: string[] }` or `{ tasks: [], error: string }`

### Key Data Flow
1. User pastes screenshot → `useClipboard` captures image
2. `ScreenshotPaste` calls `analyzeScreenshot` with image + API key
3. AI returns task strings → `useTodos.addTodos` batch-inserts them
4. `TodoList` renders todos with @dnd-kit drag-and-drop (`SortableContext` + `verticalListSortingStrategy`)
5. `TodoItem` uses `useSortable` hook for drag handles and transform

### HeroUI Modal Pattern
HeroUI 3.0.0-beta.6 modals require `Modal.Container` nested **inside** `Modal.Backdrop` (not as siblings). The Backdrop renders children inside a `ModalOverlay` from react-aria-components:
```tsx
<Modal state={state}>
  <Modal.Backdrop>
    <Modal.Container>
      <Modal.Dialog>...</Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```

### Types (src/types/index.ts)
- `Todo` — `{ id, text, completed, createdAt }`
- `AnalysisResult` — `{ tasks: string[], error?: string }`
- `ClipboardImage` — `{ base64, mediaType, dataUrl }`

## Styling Conventions

- Dark theme throughout: zinc-950 background, zinc color palette
- Content constrained to `max-w-2xl`
- Global CSS imports Tailwind and HeroUI styles (`src/styles/globals.css`)
