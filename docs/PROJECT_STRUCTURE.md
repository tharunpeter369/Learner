# Project Structure

> File-system map of the **Learner** platform. Layers follow the "gold standard"
> separation defined in `AGENTS.md`. Keep this in sync when adding routes,
> components, or content.

## Tech Stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                           |
| UI             | React 19, Tailwind CSS v4, `@tailwindcss/typography` |
| Theming        | `next-themes` (class-based light/dark)            |
| Auth + DB      | Supabase (PostgreSQL, GitHub OAuth, `@supabase/ssr`) |
| Content        | MDX via `next-mdx-remote`                         |
| Code editor    | Monaco (`@monaco-editor/react`)                   |
| Code execution | Piston API (`emkc.org/api/v2/piston/execute`)     |
| Icons          | `lucide-react`                                    |

## Directory Tree

```
src/
├── app/                                   # Routing Layer (RSC by default)
│   ├── layout.tsx                         # Root layout — fonts + ThemeProvider
│   ├── page.tsx                           # "/" — lists all learning paths
│   ├── globals.css                        # Tailwind + custom CSS
│   ├── auth/
│   │   └── callback/route.ts              # OAuth code → Supabase session
│   └── path/
│       └── [pathId]/
│           ├── page.tsx                   # "/path/:pathId" — syllabus overview
│           └── module/
│               └── [moduleId]/
│                   └── page.tsx           # module view (3 tabs)
│
├── components/                            # View Layer ("use client" at leaves)
│   ├── Topbar.tsx                         # header: brand, back, title, actions
│   ├── ThemeProvider.tsx                  # wraps next-themes provider
│   ├── ThemeToggle.tsx                    # sun/moon theme switch
│   ├── LoginButton.tsx                    # GitHub OAuth + session display
│   ├── ProgressToggle.tsx                 # mark module complete → `progress`
│   ├── LearnMode.tsx                      # content + drill timer + notes
│   ├── EditorWrapper.tsx                  # dynamic( ssr:false ) Monaco loader
│   └── EditorPlayground.tsx              # Monaco + run (Piston) + save code
│
├── lib/
│   └── mdx.ts                             # getModuleContent() — reads .mdx files
│
├── utils/
│   └── supabase/
│       ├── client.ts                      # createBrowserClient (client comps)
│       └── server.ts                      # createServerClient (cookie-based)
│
├── data/
│   └── paths/
│       ├── index.ts                       # paths registry + getSyllabus()
│       └── mern-architect.ts             # MERN syllabus (Part[] / Module[])
│
└── content/                               # CMS Layer — static MDX
    └── mern-architect/
        ├── 1.mdx                          # module 1 full content
        └── 1-syllabus.mdx                 # module 1 overview
```

## Layer Responsibilities

- **`src/app/`** — Routing only. Server Components by default; `await` params /
  searchParams (Next 15+ Promise pattern). Keep heavy logic out.
- **`src/components/`** — Reusable UI. `"use client"` only on interactive leaves.
- **`src/lib/`** — Pure utilities / data fetchers / parsers.
- **`src/utils/`** — Third-party client initializers (Supabase).
- **`src/data/`** — Static registries and metadata.
- **`src/content/`** — Hierarchical MDX: `content/{pathId}/{moduleId}.mdx`.

## Routes

| Path                                   | Component                                   | Type | Purpose                                   |
| -------------------------------------- | ------------------------------------------- | ---- | ----------------------------------------- |
| `/`                                    | `app/page.tsx`                              | RSC  | List learning paths                       |
| `/path/[pathId]`                       | `app/path/[pathId]/page.tsx`                | RSC  | Syllabus overview + progress checkmarks   |
| `/path/[pathId]/module/[moduleId]`     | `.../module/[moduleId]/page.tsx`            | RSC  | Module view: `?tab=syllabus\|learn\|practice` |
| `/auth/callback`                       | `app/auth/callback/route.ts`                | Route| Exchange OAuth code for session           |

## Content File Convention

```
src/content/{pathId}/{moduleId}.mdx           # full module content (Learn tab)
src/content/{pathId}/{moduleId}-syllabus.mdx  # overview (Syllabus tab)
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   # public anon key (safe in browser)
```

## Scripts

```bash
npm run dev     # next dev
npm run build   # next build
npm run start   # next start
npm run lint    # eslint
```
