# Reusable Build Prompts (Syllabus + Learn Content)

> Paste-ready prompts to build a new course module the same way we built
> **Module 1 — JavaScript Internals** and the **Module 2 — TypeScript** syllabus.
>
> Workflow for any new module N:
> 1. **Prompt 1** → builds `N-syllabus.mdx` (the Syllabus tab). Review & approve the module breakdown.
> 2. **Prompt 2** → builds `N.mdx` (the Learn tab) from that syllabus, one sub-module at a time, then deep-reviews.
>
> Before pasting, replace every `<…>` placeholder. For this course `<PATH_ID>` = `mern-architect`.

---

## Reference map (what these prompts rely on)

| File | Role |
| --- | --- |
| `docs/LEARN_CONTENT_GUIDE.md` | **THE rulebook** for Learn-tab content (format, accuracy bar, MDX safety). |
| `src/content/mern-architect/1-syllabus.mdx` | Gold-standard **syllabus** format to copy. |
| `src/content/mern-architect/2-syllabus.mdx` | Second example syllabus (TypeScript). |
| `src/content/mern-architect/1.mdx` | Gold-standard **Learn content** (use its Module 2 section as the per-topic template). |
| `src/data/paths/mern-architect.ts` | Source of each module's **id + exact title**. |
| `src/lib/mdx.ts` | Loader: serves `src/content/<PATH_ID>/<moduleId>.mdx` and `<moduleId>-syllabus.mdx`. |

**Render check (used by both prompts).** The dev server runs on `http://localhost:3000`.
- Syllabus: `http://localhost:3000/path/<PATH_ID>/module/<N>?tab=syllabus`
- Learn:    `http://localhost:3000/path/<PATH_ID>/module/<N>?tab=learn`
- Pass = HTTP 200 **and** no `nextjs__container_errors` / `Failed to compile` in the HTML.

---

## PROMPT 1 — Build the Syllabus tab (`<N>-syllabus.mdx`)

Fill in `<N>`, `<MODULE_TITLE>`, `<PATH_ID>`, then paste:

````text
Build the SYLLABUS-tab content for course module <N> — "<MODULE_TITLE>" in this repo. Write it to: src/content/<PATH_ID>/<N>-syllabus.mdx

FIRST, read these to lock the format and scope (use the Read tool):
1. src/content/<PATH_ID>/1-syllabus.mdx  — the GOLD-STANDARD syllabus format. Match it EXACTLY.
2. src/content/<PATH_ID>/2-syllabus.mdx  — a second worked example (TypeScript).
3. src/data/paths/<PATH_ID>.ts           — confirm module <N>'s EXACT title and where it sits in the path.

GOAL: a "perfect", architect-level syllabus for "<MODULE_TITLE>" — deep enough to defend in a senior/staff/architect interview, broken into sub-modules a learner progresses through.

MANDATORY STRUCTURE (copy 1-syllabus.mdx precisely):
- Line 1: `# <MODULE_TITLE> — Architect Level`
- A 1–2 sentence framing paragraph (treat the subject from first principles, not "X with syntax").
- `**Legend:**` line with three depth markers. Adapt the two non-🎯 markers to the subject, e.g.:
  `**Legend:** 🎯 = high-frequency interview hotspot · ⚙️ = <runtime/compiler/tooling> internals · 🧠 = mental-model / deep-theory depth`
- `**Prerequisites:**` line. `**Outcome:**` line (what the learner can DO afterward).
- `---`
- Then 12–18 SUB-MODULES numbered from 0. Each sub-module is:
  `## [Module K — <Sub-topic Title>](?tab=learn#module-K) <optional depth markers>`
  - 4–9 bullet points of concrete sub-topics; tag high-value ones with 🎯 / ⚙️ / 🧠.
  - End each sub-module with a `**Interview focus:**` line quoting 2–3 real interview questions.
  - Separate every sub-module with `---`.
- End with `## High-Yield Interview Question Bank (by theme) 🎯`, grouped under bold theme headings
  (e.g. "Mental model / explain it", "Implement from scratch", "Model it", "Tooling / architecture").

RULES:
- The `#module-K` anchors MUST be sequential from 0 — the Learn content will reuse them as `<h2 id="module-K">`.
- Be COMPREHENSIVE and non-overlapping: cover fundamentals → advanced → tooling/perf → architecture.
- Be technically accurate; prefer precise terminology a staff engineer would recognize.
- Keep it pure Markdown (this is the syllabus, not the lesson — no big code blocks needed).

AFTER WRITING, verify the render:
  curl -s -m 30 -o /tmp/syl.html -w "%{http_code}\n" "http://localhost:3000/path/<PATH_ID>/module/<N>?tab=syllabus"
Expect HTTP 200 and NO "nextjs__container_errors"/"Failed to compile" in /tmp/syl.html.

THEN present the sub-module list (just the titles) and ask me to approve / adjust the breakdown before we build the Learn content.
````

---

## PROMPT 2 — Build the Learn tab content (`<N>.mdx`)

Use this AFTER the syllabus for module `<N>` is approved. Fill in `<N>`, `<MODULE_TITLE>`, `<PATH_ID>`, then paste:

````text
Build the LEARN-tab content for course module <N> — "<MODULE_TITLE>" into: src/content/<PATH_ID>/<N>.mdx
This is beginner-friendly, crystal-clear teaching content for someone seeing each topic for the FIRST time.

FIRST, read these (use the Read tool) — do not skip:
1. docs/LEARN_CONTENT_GUIDE.md            — THE rulebook. Follow it exactly.
2. src/content/<PATH_ID>/1.mdx            — the GOLD-STANDARD Learn content. Read its Module 2 section
   (between `<h2 id="module-2">` and `<h2 id="module-3">`) as the EXACT per-topic template to match.
3. src/content/<PATH_ID>/<N>-syllabus.mdx — the approved syllabus: this defines the sub-modules (0..K),
   the sub-topics to cover, and the "Interview focus" questions to answer.

PER-TOPIC TEMPLATE (mandatory — group each sub-module's syllabus bullets into ~3–6 topics, each topic has, in order):
  ### <emoji> <Topic Title> — <short hook>
  #### 🧩 What is it?                 (plain definition, zero prior knowledge assumed)
  #### 🤔 Why do we need it? (the problem)   (motivation before mechanism)
  #### ⚙️ How does it work?           (mechanism step by step; add an ASCII box/arrow diagram in a ``` fence
                                       when it's a pipeline / hierarchy / state machine / queue / memory layout)
  #### 🌍 Real-life analogy           (one vivid EVERYDAY analogy — not another technical metaphor)
  #### 💻 Code example                (runnable, heavily commented, REAL outputs in comments;
                                       include the syllabus's "implement from scratch" exercises as runnable code)
  #### 🎤 Interview question          (Q + short answer, using the syllabus's Interview-focus questions)

MODULE STRUCTURE:
- Each sub-module starts with EXACTLY `<h2 id="module-K">Module K — <Sub-title from syllabus></h2>` (anchors MUST match the syllabus's `#module-K`).
- Follow it with a 1–3 sentence hook, then `---`, then the topics, each separated by `---`, ending the sub-module with a final `---`.

HARD RULES (these are why earlier drafts failed review — do not violate):
- ACCURACY IS NON-NEGOTIABLE: every technical claim must be spec/runtime-accurate, not just plausible.
  Hand-evaluate EVERY code example's output and put the REAL result in a comment. When you simplify,
  flag it explicitly with a `> **Note (simplification):**` line (see 1.mdx for the style).
- BEGINNER CLARITY: gloss every piece of jargon on first use in 2–4 words (e.g. "the **DOM** — the page's elements").
- MDX SAFETY (this breaks the build if violated): ALL JavaScript/TypeScript and ALL diagrams MUST live inside
  fenced ``` code blocks. NEVER put a bare `{`, `}`, `<`, `>`, or `[[Slot]]` in plain prose — wrap such tokens
  in backticks. (The successful render is the proof this was done right.)
- Keep ASCII diagrams ≤ ~64 characters wide so they don't overflow on mobile.

PACING: build ONE sub-module at a time. After each, verify the render and let me review before continuing.
  curl -s -m 60 -o /tmp/m.html -w "%{http_code}\n" "http://localhost:3000/path/<PATH_ID>/module/<N>?tab=learn"
  Expect HTTP 200 and NO "nextjs__container_errors"/"Failed to compile". (Note: code snippets that contain words
  like "Cannot access" can match naive error greps — confirm it's page content, not a real error overlay.)

AFTER ALL SUB-MODULES ARE WRITTEN, do a DEEP REVIEW: dispatch independent adversarial fact-checkers (in parallel,
split across the sub-modules) that HAND-EXECUTE every code example and verify every claim against the spec/runtime.
Fix every genuine inaccuracy they find, re-verify the render, and report what was fixed.
````

---

## Tips for best results

- **Run Prompt 1, approve the breakdown, THEN run Prompt 2.** The syllabus is the contract the Learn content fulfills.
- For a large module, Prompt 2 can be parallelized: dispatch one subagent per sub-module, each told to **Write to a specific temp file** (`/tmp/<PATH_ID>-mods/<K>.mdx`) and output only that file. Then assemble in order and run the deep-review pass. (Telling agents the exact output path avoids the "some edit the file, some return text" inconsistency.)
- Keep `docs/LEARN_CONTENT_GUIDE.md` as the single source of truth — if you change the template, update the guide and these prompts together.
- The dev server must be running (`npm run dev`) for the render checks. If port 3000 is busy it's already running — reuse it.
