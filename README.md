# Study Recap

A Next.js flashcard and multiple-choice question (MCQ) study app backed by Supabase.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

## Supabase Setup

### 1. Create the database tables

Run the following SQL in your Supabase project's SQL editor:

```sql
-- Modules table
create table b_modules (
  module_id bigint primary key generated always as identity,
  section_title text not null,
  unit_title text not null,
  module_title text not null,
  flashcard_count integer not null default 0,
  homework_mcq_count integer not null default 0
);

-- Flashcards table
create table b_flashcards (
  id bigint primary key generated always as identity,
  flashcard_number integer not null,
  module_id bigint not null references b_modules(module_id),
  body text not null,
  explanation text
);

-- MCQs table
create table b_mcqs (
  id bigint primary key generated always as identity,
  question_number integer not null,
  module_id bigint not null references b_modules(module_id),
  body text not null,
  correct_option_number integer not null,
  option_text1 text not null,
  option_text2 text not null,
  option_text3 text not null,
  option_text4 text not null,
  explanation1 text,
  explanation2 text,
  explanation3 text,
  explanation4 text,
  skill_level text
);
```

### 2. Get your API credentials

In your Supabase project dashboard, go to **Project Settings > API** and copy:

- **Project URL** — looks like `https://<project-ref>.supabase.co`
- **anon public key** — the `anon` key under "Project API keys"

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
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

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint |

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
