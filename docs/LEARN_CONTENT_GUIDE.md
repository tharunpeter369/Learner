# Learn-Tab Content Authoring Guide (THE RULEBOOK)

> **Read this before writing or editing any Learn-tab module content** in
> `src/content/<pathId>/<moduleId>.mdx`. Modules 0 and 1 of
> `mern-architect/1.mdx` are the reference standard — match them exactly.
>
> Goal: content so clear that **a beginner who has never seen the topic
> understands every sentence** — what it is, why it exists, how it works, with a
> real-life analogy, a code example, and the interview questions actually asked.

---

## 1. The Per-Topic Template (MANDATORY — do not deviate)

Break each module into **self-contained topics**. Every topic MUST have these
sections, in this order, with these exact emoji headers:

```mdx
### <emoji> <Topic Title> — <short hook>

#### 🧩 What is it?
Plain-language definition. Assume zero prior knowledge.

#### 🤔 Why do we need it? (the problem)
The problem it solves / what breaks without it. Motivation before mechanism.

#### ⚙️ How does it work?
The mechanism, step by step. Add an ASCII diagram here when the concept is
spatial, sequential, or otherwise "clearer shown than told" (see §3).

#### 🌍 Real-life analogy
One vivid, relatable analogy that makes it stick. Tie it back to the mechanism.

#### 💻 Code example
Runnable, heavily-commented snippet. Show output in comments. (Optional only
when a topic is purely conceptual — but prefer to include one.)

#### 🎤 Interview question
One or more **Q + short answer** pairs. Use the real questions from the
matching `*-syllabus.mdx` "Interview focus" / question bank.
```

- Not every section needs every sub-part **only** when it genuinely doesn't
  apply (e.g. a conceptual topic with no natural code). Default = include all.
- Sub-parts use `####`. Topic titles use `###`. Module title stays the
  existing `<h2 id="module-N">…</h2>` anchor (do NOT change anchors — the
  syllabus deep-links to them).

## 2. Module-Level Structure

```mdx
<h2 id="module-N">Module N — <Title></h2>

<1–3 sentence hook that frames the module with a question or a "why care">

---

### <emoji> Topic 1 …
（full template）

---

### <emoji> Topic 2 …
（full template）

---
```

- Separate every topic with a `---` horizontal rule.
- Open the module with a **hook**, not a dry definition (see Module 0/1 intros).
- Keep the existing emoji-header style: 🧩 What · 🤔 Why · ⚙️ How · 🌍 Analogy ·
  💻 Code · 🎤 Interview.

## 3. Diagrams (Pictorial Content)

- **Now:** ASCII box-and-arrow diagrams inside a plain fenced ` ``` ` block.
  They render in `prose`, work in light/dark mode, need zero setup.
- **Later:** Mermaid (to be wired into the MDX pipeline) for upgrading the most
  important diagrams. Until then, ASCII only.
- Add a diagram whenever a concept is a **pipeline, hierarchy, state machine,
  queue, or memory layout**. If words alone are clear, skip it — don't decorate.
- Keep diagrams narrow (≈ ≤ 64 chars wide) so they don't overflow on mobile.

## 4. Accuracy Bar (NON-NEGOTIABLE)

- **Every technical claim must be spec-accurate**, not just plausible-sounding.
  Verify against ECMA-262 / V8 docs / MDN before writing.
- When you simplify, **explicitly flag it** as a simplification (see Module 1's
  "slot 0 / slot 1" note) rather than stating it as literal fact.
- **Re-evaluate every code example's output by hand** and put the real result in
  a comment. (We verified `[] + {}` → `"[object Object]"`, etc.)
- Past accuracy slip to avoid: "internal slots are on *every value*" — they're on
  **objects**, and are slot-specific. Precision matters.

## 5. Beginner-Clarity Bar

- **Gloss jargon on first use** in 2–4 words: "the **DOM** — the page's elements",
  "**`fs`** — the file system". Never assume a beginner knows an acronym.
- Prefer short sentences. Lead with the intuitive idea, then add precision.
- Analogies must be genuinely everyday (chess, baristas, bouncers, shipping
  forms) — not another technical metaphor.

## 6. MDX Safety (so it compiles)

- **All JavaScript/TypeScript and all diagrams go inside fenced code blocks.**
  MDX treats a bare `{` as a JS expression and a bare `<` as a tag — both break
  the build if they appear in raw prose. Keep `{`, `}`, `<`, `>`,
  `[[Slot]]` inside backticks or fenced blocks.
- Use `&&`, `||=`, modern JS freely — `next-mdx-remote` handles current syntax.

## 7. Verify Before Claiming Done

Dev server runs on `http://localhost:3000`. After each module:

```bash
curl -s -o /tmp/m.html -w "%{http_code}\n" \
  "http://localhost:3000/path/mern-architect/module/1?tab=learn"
# Expect: 200
grep -o "nextjs__container_errors\|Failed to compile" /tmp/m.html   # expect: nothing
```

- Confirm HTTP 200, your new topic markers are present, and **no error overlay**.
- A false-positive note: code snippets that contain words like "Cannot access"
  (a TDZ error string) will match naive error greps — check it's page content,
  not a real `nextjs__container_errors` overlay.

## 8. Workflow & Pacing

1. Read the matching `*-syllabus.mdx` to get the topic list + interview questions.
2. Read the current module's exact text (watch trailing whitespace) before editing.
3. Rewrite **one module at a time**; verify render; get user review before the next.
4. Keep the accuracy + beginner pass as a self-review step every time.

---

### Quick checklist (per topic)
- [ ] 🧩 What / 🤔 Why / ⚙️ How / 🌍 Analogy / 💻 Code / 🎤 Interview all present
- [ ] ASCII diagram if pipeline/hierarchy/state/memory
- [ ] Every claim spec-verified; simplifications flagged
- [ ] Jargon glossed on first use
- [ ] Code output re-checked by hand, shown in comments
- [ ] All code/diagrams inside fenced blocks (MDX-safe)
- [ ] Renders HTTP 200, no error overlay
