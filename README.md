# Study Recap

A Next.js flashcard and multiple-choice question (MCQ) study app backed by Supabase.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Setup

### Get your API credentials

In your Supabase project dashboard, go to **Project Settings > API** and copy:

- **Project URL** — looks like `https://<project-ref>.supabase.co`
- **Publishable public key** — the publishable key under "Project API keys"

### Configure environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

> `.env.local` is git-ignored and will not be committed.

## Local Development

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Build for production                     |
| `npm run start` | Run the production build locally         |
| `npm run lint`  | Run ESLint                               |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Module selection landing page
│   ├── layout.tsx                # Root layout
│   └── study/[moduleId]/
│       └── page.tsx              # Study session page
├── components/
│   ├── FlashcardDisplay.tsx
│   ├── MCQDisplay.tsx
│   ├── ModuleCard.tsx
│   ├── NavButtons.tsx
│   └── ProgressBar.tsx
├── hooks/
│   ├── useModules.ts             # Fetches modules from Supabase
│   ├── useCards.ts               # Fetches flashcards & MCQs for a module
│   └── useAutoAdvance.ts         # Auto-advance timer logic
├── lib/
│   └── supabaseClient.ts         # Supabase client singleton
└── types/
    └── index.ts                  # TypeScript interfaces
```

## Features

- Browse study modules on the landing page
- Configurable auto-advance timer (5–120 seconds, default 15 s)
- Keyboard shortcuts during a study session:
  - `→` / `←` — next / previous card
  - `Space` — pause / resume auto-advance
  - `Escape` — return to module selection
