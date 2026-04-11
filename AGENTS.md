# Study Recap — Agent Guide

A Next.js flashcard and MCQ study application backed by Supabase, with an OpenAI-powered Ask AI panel.

## Development Commands

```bash
npm install        # Install dependencies
npm run dev        # Start dev server at http://localhost:3000
npm run build      # Production build (run before shipping changes)
npm run start      # Run production build locally
npm run lint       # Run ESLint
```

There is no test suite. Verify behavior by running `npm run dev` and checking the browser, or run `npm run build` to catch TypeScript/lint errors.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (exposed to browser) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase public/anon key (exposed to browser) |
| `OPENAI_API_KEY` | Yes | OpenAI API key (server-side only) |
| `OPENAI_BASE_URL` | No | OpenAI endpoint (default: `https://api.openai.com/v1`) |
| `OPENAI_MODEL` | No | Model name (default: `gpt-4o-mini`) |

## Architecture

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (fonts, theme script, ErrorBoundary)
│   ├── page.tsx                  # Module selection landing page
│   ├── globals.css               # Global styles + CSS variables for theming
│   ├── robots.ts                 # SEO robots config
│   ├── api/ask-ai/route.ts       # POST — OpenAI streaming endpoint
│   └── study/
│       ├── [moduleId]/page.tsx   # Study session for a single module
│       └── sections/page.tsx     # Study session spanning multiple sections
├── components/                   # React components (all client-side)
│   ├── AskAITab.tsx              # Collapsible AI chat panel (SSE streaming)
│   ├── CardListOverlay.tsx       # Quick-jump card navigator overlay
│   ├── CardProgressTrack.tsx     # Visual progress bar along card edges
│   ├── ErrorBoundary.tsx         # React error boundary
│   ├── FlashcardDisplay.tsx      # Renders flashcard front/back
│   ├── Icons.tsx                 # SVG icon components
│   ├── KeyboardShortcutsOverlay.tsx # Help overlay for keyboard shortcuts
│   ├── LoadingSkeleton.tsx       # Skeleton loaders
│   ├── MCQDisplay.tsx            # Multiple-choice question display
│   ├── ModuleCard.tsx            # Module tile on the landing page
│   ├── NavButtons.tsx            # Prev/next/home/pause navigation
│   ├── ProgressBar.tsx           # Auto-advance timer progress bar
│   └── ThemeToggle.tsx           # Dark/light mode toggle
├── hooks/                        # Custom React hooks
│   ├── useAutoAdvance.ts         # Auto-advance timer (pause/resume)
│   ├── useCards.ts               # Fetch flashcards + MCQs for a module
│   ├── useModules.ts             # Fetch all modules with card counts
│   └── useSectionCards.ts        # Fetch cards across multiple sections
├── lib/
│   ├── cardContext.ts            # Format card content for AI prompts
│   ├── html.ts                   # HTML decode/strip/sanitize utilities
│   ├── rateLimit.ts              # In-memory sliding-window rate limiter
│   └── supabaseClient.ts         # Supabase singleton client
└── types/
    └── index.ts                  # Core TypeScript interfaces
```

## Database (Supabase / PostgreSQL)

Tables are read-only from the app. No migrations are stored in the repo — they are managed in the Supabase dashboard.

| Table | Key Columns |
|-------|-------------|
| `b_modules` | `id`, `section`, `unit`, `title`, `ordering` |
| `b_flashcards` | `id`, `module_id`, `card_number`, `body`, `explanation` |
| `b_mcqs` | `id`, `module_id`, `question_number`, `question`, `option_a/b/c/d`, `correct_answer`, `explanation_a/b/c/d` |

Sections are string labels: `FAR`, `AUD`, `REG`, `ISC`.

## Key Patterns

### Routing
- `/` — module selection, supports URL params `?sections=`, `?timer=`, `?cardType=`
- `/study/[moduleId]` — study a single module
- `/study/sections?sections=FAR,AUD` — study multiple sections

### Card Types
`StudyCard` is a union: `{ type: 'flashcard', ...Flashcard } | { type: 'mcq', ...MCQ }`. Always check `card.type` before rendering.

### Theming
Dark/light mode uses CSS custom properties defined on `:root` and `[data-theme="dark"]` in `globals.css`. Theme preference persists in `localStorage` under the key `theme`. A blocking inline script in `layout.tsx` sets `data-theme` before first paint to prevent flash.

### AI Streaming
`api/ask-ai/route.ts` returns a `text/event-stream` response. `AskAITab.tsx` consumes it with `ReadableStream`. Rate limiting is enforced server-side: 20 requests per IP per minute via `lib/rateLimit.ts` (in-memory, resets on server restart).

### MCQ Shuffling
`MCQDisplay.tsx` uses a seeded Fisher-Yates shuffle keyed on `card.id` so option order is stable across re-renders for the same card but differs per card.

### HTML Content
Card content from Supabase may contain HTML entities and tags. Use helpers from `lib/html.ts`:
- `sanitizeHtml()` for safe rendering
- `stripHtml()` when plain text is needed (e.g., AI context)

## Conventions

- **No test files** exist yet. Do not add a test runner without confirming with the project owner.
- **TypeScript strict mode** is enabled. Avoid `any`; use proper types from `src/types/index.ts`.
- **Path alias**: `@/` maps to `src/`. Always use `@/` for imports, not relative `../../` paths across directories.
- **Client components**: All components in `src/components/` are client components (`"use client"`). Keep server-side logic in `src/app/api/` routes or in hooks that only run data fetching.
- **CSS**: Styles live in `globals.css`. Do not introduce CSS modules or Tailwind unless asked.
- **No ORMs**: Supabase JS client is used directly. Keep queries in hooks (`src/hooks/`), not in components.
- **HTML sanitization**: Always pass user-rendered HTML through `sanitizeHtml()` from `lib/html.ts` to prevent XSS.
- **Rate limiting**: The Ask AI endpoint is rate-limited. Do not remove or bypass `rateLimit.ts`.
