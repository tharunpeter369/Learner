# AI Agent Guidelines & Coding Standards

This document establishes the **International Gold Standard** for the Learner platform architecture. As an AI Agent operating in this codebase, you MUST adhere to these rules strictly to ensure the project remains scalable, maintainable, and enterprise-grade.

## 1. Tech Stack Overview
- **Framework:** Next.js 15 (App Router)
- **UI & Styling:** React 19, Tailwind CSS v4, `next-themes` (Class-based Light/Dark mode)
- **Database & Auth:** Supabase (PostgreSQL, GitHub OAuth)
- **Content:** MDX (`next-mdx-remote/rsc`)
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)

## 2. Project Structure (Gold Standard)
The codebase follows a strict separation of concerns within the `src/` directory:
- `src/app/` - **Routing Layer:** Contains layout, pages, and route handlers. Default to **React Server Components (RSC)**. Do not put heavy logic here; keep routes clean.
- `src/components/` - **View Layer:** Reusable UI components. Break complex UIs into smaller components. Use `"use client"` **only** at the leaf nodes when interactivity, state, or hooks are required.
- `src/lib/` - **Utility Layer:** Pure functions, data fetchers, and parsers (e.g., `mdx.ts`).
- `src/utils/` - **Platform Layer:** Third-party client initializers (e.g., Supabase client/server utilities).
- `src/data/` - **Static Data Layer:** Registries, metadata, and configuration objects (e.g., `paths/index.ts`).
- `src/content/` - **CMS Layer:** Static MDX files organized hierarchically (e.g., `src/content/[pathId]/[moduleId].mdx`).

## 3. Coding Standards

### TypeScript & Type Safety
- **Strict Types:** `any` is strictly prohibited. Define explicit `interface` or `type` for all props, database responses, and component states.
- **Null Safety:** Always use optional chaining (`?.`) and nullish coalescing (`??`) when handling dynamic data or API responses.

### React & Server Components
- **Server by Default:** Always fetch data on the server. Do not fetch data on the client unless polling or highly dynamic user interactions require it.
- **Client Boundary:** Push `"use client"` as far down the component tree as possible. Never put `"use client"` in a layout or a page if it can be extracted to a smaller wrapper component.
- **Suspense & Loading:** Always account for loading states. Handle asynchronous operations gracefully so the UI doesn't flash or break.

### Styling & UI Design
- **Tailwind v4:** Use Tailwind utility classes. Avoid custom CSS unless absolutely necessary (e.g., custom animations in `globals.css`).
- **Dark/Light Mode Native:** The platform natively supports both modes. **Every** component you build must have both light defaults and `dark:` overrides. 
  - *Example:* `bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white`
- **Premium Aesthetics:** Do not use primary RGB colors (e.g., plain red/blue). Use curated palettes like `emerald` for primary accents, and `neutral` for grayscaled backgrounds. Ensure high contrast and accessible design. Use `lucide-react` for crisp, consistent iconography.

### Database & State
- **Supabase Conventions:** Use the server client for fetching data in pages. Use the browser client for mutating data (like saving progress or notes) from client components. Always handle RLS (Row Level Security) and ensure users only read/write their own `uid`.
- **Global IDs:** Use composite/global IDs (e.g., `${pathId}-${moduleId}`) when storing data to prevent collisions across multiple learning paths.

## 4. Agent Operations
- **Do not break the build:** Ensure you import things correctly (e.g., if you write `import X from '@/foo'`, verify `X` is exported).
- **Do not assume structure:** Read files before modifying them to understand the context.
- **Clean up your code:** Remove dead code, redundant console logs, and unused imports before ending your turn.
- **Next.js 15 Nuances:** Read the relevant guide in `node_modules/next/dist/docs/` before using newer features. Remember that `params` and `searchParams` in Next.js 15 Server Components are now Promises and MUST be `await`ed.

> *"Write code as if the person who ends up maintaining it will be a violent psychopath who knows where you live."* — John Woods
