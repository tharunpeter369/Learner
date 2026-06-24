# Project Overview — Quick Reference

> A mental model of the **Learner** platform for fast ramp-up. Read this first,
> then `PROJECT_STRUCTURE.md` for the file map.

## What It Is

A self-paced engineering learning platform. Each **path** (course) contains
**parts**, each part contains **modules**, and each module renders MDX content
plus an interactive code playground. User progress, notes, and saved code persist
to Supabase. The one live path is **MERN Architect** (25 modules / 5 parts);
Python, Flutter, and Go are stubbed as `comingSoon`.

## Core Data Model

```
LearningPath (data/paths/index.ts)
  id, title, description, comingSoon?

Part (data/paths/mern-architect.ts)
  id, numeral, title, description, modules[]

Module
  id, number, title, timeHours, depth ('Know'|'Explain'|'Architect'), description
```

`getSyllabus(pathId)` maps a pathId → its `Part[]`. **Currently hardcoded** to
only return `mern-architect` (see Gotchas).

## How a Page Renders (end to end)

```
/path/mern-architect/module/1?tab=learn
  → ModulePage (RSC) awaits params + searchParams
  → getSyllabus('mern-architect') → finds Module by id
  → getModuleContent('mern-architect', '1')           → reads 1.mdx
  → getModuleContent('mern-architect', '1-syllabus')  → reads 1-syllabus.mdx
  → tab determines what shows:
        syllabus → static metadata + <MDXRemote> of 1-syllabus.mdx
        learn    → <LearnMode> wrapping <MDXRemote> of 1.mdx
        practice → <EditorWrapper> → <EditorPlayground> (Monaco)
```

MDX is read from disk with `fs` at request time (no build step) and rendered
via `next-mdx-remote` with Tailwind `prose` classes.

## The Three Module Tabs

| Tab      | Component                | What it does                                          |
| -------- | ------------------------ | ----------------------------------------------------- |
| Syllabus | `MDXRemote` (server)     | Static module metadata + `{id}-syllabus.mdx`          |
| Learn    | `LearnMode` (client)     | `{id}.mdx` + 3-min "architect drill" timer + notes    |
| Practice | `EditorWrapper` (client) | Monaco editor; run via Piston API; save code          |

## Auth & Persistence

**Auth flow:** `LoginButton` → Supabase GitHub OAuth → `/auth/callback` (server)
→ `exchangeCodeForSession(code)` → session cookie set.

**Supabase clients:**
- `utils/supabase/client.ts` — `createBrowserClient`, used by client components
  for mutations.
- `utils/supabase/server.ts` — `createServerClient` (cookie-based), used by
  Server Components for auth-aware reads.

**Tables** (all keyed by `uid` + composite `module_id = "{pathId}-{moduleId}"`):

| Table        | Fields                                      | Written by         |
| ------------ | ------------------------------------------- | ------------------ |
| `progress`   | uid, module_id, status                      | `ProgressToggle`   |
| `notes`      | uid, module_id, topic_id, content           | `LearnMode`        |
| `saved_code` | uid, module_id, problem_id, code, language  | `EditorPlayground` |

`status` ∈ `unstarted | in_progress | done`. `PathPage` reads `progress`
server-side to render completion checkmarks.

## Server vs Client Boundary

- **Server (RSC):** all `app/*/page.tsx`, `auth/callback/route.ts`, MDX rendering.
- **Client (`"use client"`):** `Topbar`, `ThemeProvider`, `ThemeToggle`,
  `LoginButton`, `ProgressToggle`, `LearnMode`, `EditorWrapper`,
  `EditorPlayground`. Monaco is loaded via `dynamic(..., { ssr: false })` because
  it needs the DOM.

## Theming

`next-themes`, class-based, `defaultTheme="system"`. `ThemeProvider` lives in the
root layout; `ThemeToggle` sits in `Topbar`. Monaco maps theme → `vs-dark`/`light`.

## Code Execution

`EditorPlayground` POSTs to the **Piston API**
(`https://emkc.org/api/v2/piston/execute`) with the language + file content, then
shows `data.run.output` in a split console pane. No server-side sandbox.

## Gotchas / Tech Debt (as of the `feature` branch)

1. **`getSyllabus` is hardcoded** to `mern-architect` (`data/paths/index.ts`).
   Adding a path means editing this function — not yet a real registry lookup.
2. **Only module 1 has content.** Modules 2–25 hit the "not written yet"
   fallback until their `.mdx` files exist.
3. **`any` used for the user object** in `ProgressToggle` / `LearnMode`
   (`useState<any>(null)`) — violates the `AGENTS.md` no-`any` rule. Should be
   `User | null` from `@supabase/supabase-js`.
4. **Duplicated upsert logic** — the select-then-update/insert pattern is copied
   across `ProgressToggle`, `LearnMode`, and `EditorPlayground`. A single
   Supabase `.upsert()` with a composite unique constraint would collapse them.
5. **Version doc drift** — `package.json` pins Next `16.2.9`, but
   `AGENTS.md`/`CLAUDE.md` say "Next.js 15."

## Where To Start For Common Tasks

| Task                          | Start here                                         |
| ----------------------------- | -------------------------------------------------- |
| Add a new learning path       | `data/paths/index.ts` + new `data/paths/<id>.ts` + `getSyllabus` |
| Add/edit module content       | `src/content/{pathId}/{moduleId}.mdx`              |
| Change module page layout     | `app/path/[pathId]/module/[moduleId]/page.tsx`     |
| Adjust progress/notes/code DB | respective client component + Supabase table       |
| Tweak header/nav              | `components/Topbar.tsx`                             |
| Theme behavior                | `components/ThemeProvider.tsx` + root `layout.tsx` |
