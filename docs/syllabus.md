# PERSONAL ENGINEERING CODEX
## The Architect's Path
### A Senior Frontend · Fullstack · Desktop Mastery Syllabus

Built for a foundation of roughly two and a half years of React with TypeScript, two years of Node.js, and production Electron experience. The goal is the move from senior engineer — someone who builds what is asked — to architect — someone who decides how systems are built and can defend every choice.

This is a reference to plan against, not a checklist to race through. The order is a recommendation: foundations support frontend, frontend and backend feed system design, and the cross-cutting disciplines run throughout. Move faster through what you already know; go deep where you do not.

---

## How to Use This Codex

Each of the twenty-five modules carries two markers. A time estimate, in focused hours, that already assumes your existing experience — it is time spent reaching explain-or-architect depth, not learning from zero. And a depth tier, which tells you how far to push.

### THE THREE DEPTH TIERS
*   **Know** — you can define it and give an example.
*   **Explain** — you can teach it, including why it works and where it breaks.
*   **Architect** — you can choose between options, justify the choice with trade-offs, and discuss failure modes at scale. This is the bar senior-architect interviews actually test.

Each module also ends with a Mastery check — a single concrete thing you should be able to do, out loud and without notes, before you consider that module done. When you can pass the check, move on.

One habit to carry through all of it: answer everything out loud, and end every technical answer with the words “… and the trade-off is.” That sentence is what separates senior from architect.

---

## The Map at a Glance
Five parts, twenty-five modules.

| Part | Modules | Focus | Hours |
| :--- | :--- | :--- | :--- |
| I · Language Foundations | 2 | JavaScript internals, TypeScript as architecture | 42 – 56 |
| II · Frontend Engineering | 7 | Rendering, React internals, performance, FE system design | 88 – 120 |
| III · Backend & Node.js | 6 | Node internals, APIs, data, fullstack system design | 88 – 118 |
| IV · Desktop / Electron | 4 | Process model, security, native, distribution | 40 – 56 |
| V · Cross-Cutting Mastery | 6 | Testing, DevOps, security, patterns, DSA, leadership | 98 – 130 |

Total: roughly 360 to 480 focused hours. That breadth is the point — this is the full surface a frontend, fullstack, and desktop architect is expected to reason about. It is a marathon measured in months, and depth, not speed, is what it rewards.

### WHAT THAT MEANS IN CALENDAR TIME

| Pace | Roughly |
| :--- | :--- |
| ~10 hrs / week (steady, alongside a job) | 8 – 11 months |
| ~15 hrs / week (committed) | 6 – 8 months |
| Full-time (~35 hrs / week) | 2.5 – 3.5 months |

Treat these as honest brackets, not promises. Some weeks you will fly through review material; others a single hard topic will take all your hours. Both are normal.

---

## Part I - Language Foundations

Everything above is built on these two. The work here is to push your daily-use knowledge down to the level where you can explain the machine, not merely operate it.

### 01 JavaScript Internals & Mastery
*   **TIME:** 18 – 24 focused hours
*   **DEPTH:** Architect

The runtime behavior behind everything you build, and where senior candidates are most often exposed.

**CORE TOPICS**
*   Execution model and the event loop: call stack, microtasks vs macrotasks, starvation.
*   Scope, closures, the temporal dead zone, and their memory implications.
*   Prototypes and the chain, classes as syntactic sugar, property descriptors.
*   The four `this` binding rules and arrow-function lexical `this`.
*   Async patterns: promises, async/await, the Promise combinators, a concurrency-limited pool, AbortController.
*   Memory and garbage collection: mark-and-sweep, common leak patterns, WeakMap / WeakRef.
*   ESM vs CommonJS, generators, Proxy and Reflect.

**Mastery check.** Trace a mixed sync / Promise / setTimeout snippet's output, explain a real closure leak, and implement a promise pool with a concurrency limit from scratch.

### 02 TypeScript Mastery
*   **TIME:** 24 – 32 focused hours
*   **DEPTH:** Architect

At senior level, types are architecture. A well-typed API surface is a contract that turns misuse into a compile error.

**CORE TOPICS**
*   Structural typing; any / unknown / never / void; narrowing; discriminated unions.
*   Type guards and assertion functions.
*   Generics with constraints and defaults.
*   Conditional types with `infer`; mapped types with key remapping; keyof and indexed access; template literal types.
*   Reimplementing the utility types (Partial, Pick, Omit, ReturnType).
*   `satisfies`, branded / opaque types, variance.
*   End-to-end type safety (tRPC, zod inference, OpenAPI codegen).
*   Declaration files and module augmentation (typing the Electron bridge); the strict flags.

**Mastery check.** Write `DeepReadonly<T>`, a typed event-emitter, and a function whose return type is conditional on its argument — live, without reference.

---

## Part II - Frontend Engineering

Your home turf, taken to architect depth: the rendering pipeline, React's internals, measurable performance, and the design of large front ends.

### 03 Browser & Rendering Internals
*   **TIME:** 12 – 16 focused hours
*   **DEPTH:** Explain

Understand the machine your UI runs on so performance work is causal rather than cargo-cult.

**CORE TOPICS**
*   HTML to DOM, CSS to CSSOM, the render tree and the accessibility tree.
*   The critical rendering path.
*   Reflow (layout) vs paint vs composite; layout thrashing and read/write batching.
*   GPU layer promotion (will-change, transform: translate3d) and the compositor thread.

**Mastery check.** Explain why a given DOM mutation causes jank and which phase — layout, paint, or composite — each fix targets.

### 04 Performance & Core Web Vitals
*   **TIME:** 14 – 18 focused hours
*   **DEPTH:** Architect

Performance is measurable and ownable; architects set budgets and defend them with numbers.

**CORE TOPICS**
*   LCP, INP, and CLS: what each measures and one concrete fix for each.
*   Loading: critical path, resource hints, code splitting, tree-shaking, bundle analysis, hydration cost.
*   Runtime: the 16ms frame budget, long tasks, rAF / requestIdleCallback / Scheduler, Web Workers, list virtualization.
*   Delivery: HTTP caching, CDN, service workers, content-hash busting.
*   Profiling jank in DevTools; performance budgets gated in CI.

**Mastery check.** Take an eight-second-to-interactive dashboard and produce a prioritized, measured remediation plan.

### 05 React Internals & Concurrent Rendering
*   **TIME:** 16 – 22 focused hours
*   **DEPTH:** Architect

Move from using React to explaining it under load.

**CORE TOPICS**
*   Virtual DOM, reconciliation, and key correctness.
*   Fiber architecture: the linked-list tree, units of work, pause / resume / discard.
*   Render phase vs commit phase.
*   Concurrent rendering, time-slicing, tearing, and useSyncExternalStore.
*   Hooks deeply: useEffect as synchronization, useRef, useLayoutEffect, and the rules of hooks (and why).
*   useTransition and useDeferredValue.

**Mastery check.** Diagnose an over-rendering app with the Profiler and explain each fix in terms of what React actually does.

### 06 State Management & Data Fetching
*   **TIME:** 10 – 14 focused hours
*   **DEPTH:** Architect

Choosing a state strategy is an architecture decision; be opinionated and able to justify it.

**CORE TOPICS**
*   The state taxonomy — server, client/UI, global, URL, form — each handled differently.
*   Server state with TanStack Query: caching, stale-while-revalidate, invalidation, mutations, optimistic updates with rollback, pagination.
*   Global stores: Redux Toolkit vs Zustand vs Jotai, and their trade-offs.
*   The Context re-render trap.
*   The React Compiler (React 19) and what it changes about manual memoization.

**Mastery check.** Explain when not to use Redux, and how you keep server cache and UI in sync after a mutation.

### 07 React 19, RSC & Server-Driven UI
*   **TIME:** 12 – 16 focused hours
*   **DEPTH:** Architect

Be current; this is the highest-yield modern-React interview material.

**CORE TOPICS**
*   Actions with useActionState, useOptimistic, and useFormStatus.
*   The `use` hook.
*   Server Components (stable): server-only execution, zero client JS, serialized payload.
*   Server Actions ("use server").
*   The "use client" boundary and serialization limits.
*   CSR vs SSR vs SSG/ISR vs RSC — when each wins and the hydration trade-offs.

**Mastery check.** Design the server/client boundary for a content-heavy app and justify every "use client" island.

### 08 CSS & Styling Architecture
*   **TIME:** 8 – 12 focused hours
*   **DEPTH:** Explain

Architects own the styling strategy, not just the styles.

**CORE TOPICS**
*   Cascade, specificity, stacking and containing blocks.
*   Flexbox, Grid, container queries, logical properties.
*   Methodologies: BEM, Tailwind, CSS Modules, runtime vs zero-runtime CSS-in-JS, and their trade-offs.
*   Theming via custom properties and design tokens; dark mode.
*   Performance: content-visibility, cheap selectors, avoiding thrash.

**Mastery check.** Choose and defend a styling approach for a multi-brand design system.

### 09 Frontend System Design
*   **TIME:** 16 – 22 focused hours
*   **DEPTH:** Architect

The round most under-prepared seniors fail; it is a learnable, repeatable format.

**CORE TOPICS**
*   A repeatable framework: requirements, API contract, component architecture, state and caching, rendering strategy, performance budget, codebase scalability, edge cases, observability.
*   Classic prompts: feed / infinite scroll, autocomplete, collaborative editor, email client, design system.
*   Codebase architecture: monorepos (Nx, Turborepo), micro-frontends and Module Federation, design tokens.

**Mastery check.** Whiteboard a large app end-to-end and articulate the trade-off behind every major choice.

---

## Part III - Backend & Node.js

From writing endpoints to running services and designing systems: internals, the data layer, API contracts, and scale.

### 10 Node.js Internals & Concurrency
*   **TIME:** 16 – 22 focused hours
*   **DEPTH:** Architect

Deepen daily Node use into runtime internals and concurrency models.

**CORE TOPICS**
*   V8 (JIT, hidden classes, inline caching, GC) at explain-depth.
*   The libuv event-loop phases and the thread pool.
*   process.nextTick vs setImmediate vs setTimeout ordering.
*   Single-thread plus non-blocking I/O: why it scales for I/O and fails for CPU.
*   cluster vs worker_threads vs child_process, and when to use each.
*   Race conditions in async I/O and how to make operations atomic.

**Mastery check.** Explain precisely why an endpoint times out under load and which concurrency tool fixes which cause.

### 11 Streams, Backpressure & Production Node
*   **TIME:** 10 – 14 focused hours
*   **DEPTH:** Architect

The production concerns that separate "I built an API" from "I run services."

**CORE TOPICS**
*   Readable / Writable / Duplex / Transform streams; pipe and pipeline.
*   Backpressure: what it is and how streams resolve it.
*   Large-file and stream processing without buffering into memory.
*   Operational vs programmer errors; graceful shutdown (SIGTERM, drain, close pools).
*   Structured logging with correlation IDs; 12-factor config with fail-fast validation.
*   Memory leaks and heap snapshots.

**Mastery check.** Explain backpressure with a concrete example and design a graceful-shutdown sequence.

### 12 API Design
*   **TIME:** 14 – 18 focused hours
*   **DEPTH:** Architect

Designing the contract is core architect work.

**CORE TOPICS**
*   REST: resource modeling, status codes, idempotency, cursor vs offset pagination, versioning, rate limiting.
*   GraphQL: schema, resolvers, the N+1 problem and DataLoader, depth/complexity limits.
*   gRPC and protobuf for service-to-service communication.
*   tRPC for end-to-end TypeScript type safety.
*   Realtime: WebSockets, SSE, long polling, and scaling with a Redis backplane.
*   Auth in APIs: JWT vs sessions, OAuth2/OIDC, idempotency keys, request validation.

**Mastery check.** Compare REST vs GraphQL for a given product and explain the N+1 fix.

### 13 Databases & the Data Layer
*   **TIME:** 18 – 24 focused hours
*   **DEPTH:** Architect

Data modeling and consistency decisions are where architecture lives or dies.

**CORE TOPICS**
*   SQL vs NoSQL decision framework.
*   Indexing (B-tree, composite, covering) and reading EXPLAIN.
*   ACID and isolation levels, and the anomalies each prevents.
*   Transactions; pessimistic vs optimistic locking.
*   The N+1 query problem.
*   Connection pooling, prepared statements, injection prevention.
*   Scaling: read replicas, sharding/partitioning, CAP and PACELC, eventual vs strong consistency.
*   Zero-downtime migrations (expand/contract).

**Mastery check.** Choose a datastore and consistency model for a high-contention feature and defend it.

### 14 Caching & Distributed State (Redis)
*   **TIME:** 8 – 12 focused hours
*   **DEPTH:** Explain

Caching is the highest-leverage performance tool and the easiest to get subtly wrong.

**CORE TOPICS**
*   Cache-aside vs write-through vs write-back.
*   TTL and eviction policies (LRU / LFU).
*   Invalidation strategy; the thundering-herd / stampede problem and its fixes.
*   Redis data structures, geospatial indices, and pub/sub for horizontal scaling.
*   Cache layering: browser, CDN, application, database.

**Mastery check.** Design a caching layer for a read-heavy endpoint, including invalidation and stampede protection.

### 15 Backend & Fullstack System Design
*   **TIME:** 22 – 28 focused hours
*   **DEPTH:** Architect

The big-picture round; bring a consistent framework and trade-off fluency.

**CORE TOPICS**
*   Framework: clarify and non-functional requirements, capacity estimation, high-level design, data and API, deep-dive, scale, reliability, observability, trade-offs.
*   Building blocks: load balancers, gateways, CDNs, queues and streaming (Kafka, RabbitMQ, SQS), dead-letter queues, the outbox pattern.
*   Monolith vs modular-monolith vs microservices — the real org and operations trade-off.
*   Saga pattern, idempotency, circuit breakers, graceful degradation.
*   The three pillars of observability and SLO/SLI.
*   Drill prompts: URL shortener, rate limiter, notifications, chat, feed, file sync.

**Mastery check.** Design a system end-to-end with capacity math, failure modes, and explicit trade-offs.

---

## Part IV - Desktop / Electron

Your differentiator. Few candidates can architect a secure, performant, distributable desktop app. Own this completely — it is the part of your profile that is genuinely rare.

### 16 Process Model & IPC
*   **TIME:** 10 – 14 focused hours
*   **DEPTH:** Architect

The desktop architecture most "frontend" candidates cannot speak to — your edge.

**CORE TOPICS**
*   Main (Node) vs Renderer (Chromium) vs preload; why the multi-process model exists and its memory cost.
*   App lifecycle and BrowserWindow management.
*   IPC patterns: send/on (one-way), invoke/handle (two-way, preferred), webContents.send (main to renderer).
*   Type-safe IPC with shared TypeScript contracts.
*   Serialization limits across the boundary.

**Mastery check.** Design a typed, minimal IPC layer and explain why the Main process is the OS gateway.

### 17 Security Hardening
*   **TIME:** 10 – 14 focused hours
*   **DEPTH:** Architect

Electron ships a browser plus Node; one XSS can become full remote code execution if misconfigured. The highest-stakes desktop topic.

**CORE TOPICS**
*   The XSS to RCE escalation.
*   contextIsolation: true, nodeIntegration: false, sandbox: true.
*   Secure preload via contextBridge — one method per channel, never exposing ipcRenderer or a generic passthrough.
*   Validating the IPC sender and sanitizing payloads.
*   CSP, custom protocol vs file://, setWindowOpenHandler and will-navigate.
*   Keeping Electron current against Chromium and Node CVEs.

**Mastery check.** Spot the vulnerability in an insecure contextBridge or webPreferences snippet and explain the exploit path.

### 18 Resource, Native & Multi-Window
*   **TIME:** 10 – 14 focused hours
*   **DEPTH:** Explain

Keep a heavy runtime fast and integrated with the operating system.

**CORE TOPICS**
*   RAM footprint, cross-process leak handling, single- vs multi-window trade-offs, BrowserView / WebContentsView.
*   Startup optimization: lazy windows, V8 snapshots.
*   Native node-addons and child_process kept off the UI thread.
*   Multi-window sync without piping heavy payloads through Main.
*   Local persistence (SQLite) and offline-first sync.

**Mastery check.** Architect a multi-window app that stays responsive and lean on memory.

### 19 Production, Distribution & Auto-Update
*   **TIME:** 10 – 14 focused hours
*   **DEPTH:** Explain

Shipping a desktop app safely is its own discipline.

**CORE TOPICS**
*   Packaging: electron-builder vs Forge, and electron-vite.
*   Code signing and notarization (macOS Gatekeeper, Windows, AppX / MSIX).
*   Auto-update (electron-updater / Squirrel): channels, staged rollouts, delta updates, rollback safety.
*   When not to use Electron: Tauri, native, or PWA.

**Mastery check.** Describe a safe end-to-end release and auto-update pipeline, including signing and rollback.

---

## Part V - Cross-Cutting Mastery

The disciplines that span every layer — and the human skills an architect is actually hired for. The last two run continuously, alongside everything else, rather than as a single block.

### 20 Testing Strategy
*   **TIME:** 14 – 18 focused hours
*   **DEPTH:** Architect

Architects define the testing strategy, not just write tests.

**CORE TOPICS**
*   The pyramid and the testing trophy.
*   Unit (Vitest / Jest); component (React Testing Library — behavior, not implementation); integration; E2E (Playwright, including driving the real Electron app).
*   Mocking with MSW; contract testing.
*   Flakiness control; coverage as a signal, not a target.

**Mastery check.** Define a layered testing strategy for a fullstack plus desktop product and justify the ratios.

### 21 Build, CI/CD & DevOps
*   **TIME:** 12 – 16 focused hours
*   **DEPTH:** Explain

Delivery is an architectural concern.

**CORE TOPICS**
*   Bundlers: Vite (esbuild + Rollup), Webpack, SWC, Module Federation.
*   Transpilation, source maps, browserslist.
*   CI/CD pipelines with caching, parallelization, and gated checks (lint, types, tests, bundle budget).
*   Docker multi-stage builds; deploy targets (static/CDN, serverless, edge, containers).
*   Feature flags, canary / blue-green, rollback; observability (Sentry, RUM).

**Mastery check.** Design a CI/CD pipeline with the quality gates you would insist on as an architect.

### 22 Security & Auth (Web / Node)
*   **TIME:** 14 – 18 focused hours
*   **DEPTH:** Architect

A senior must speak security fluently across the whole stack.

**CORE TOPICS**
*   OWASP Top 10.
*   XSS (stored / reflected / DOM), CSRF, clickjacking, CSP, SameSite / HttpOnly / Secure cookies, SRI.
*   Sessions vs JWT (storage trade-offs, why not localStorage for tokens), OAuth2/OIDC, refresh-token rotation, RBAC/ABAC.
*   Node/API: input validation, injection, SSRF, rate limiting, secrets, supply-chain, Helmet.
*   Encryption in transit and at rest, PII handling, least privilege.

**Mastery check.** Explain the JWT-vs-sessions trade-off and how you would defend an app against the OWASP Top 10.

### 23 Design Patterns & Architecture
*   **TIME:** 16 – 22 focused hours
*   **DEPTH:** Architect

Trade-off literacy is the whole point of the title.

**CORE TOPICS**
*   SOLID plus KISS / DRY / YAGNI — and when the dogma hurts.
*   GoF patterns that recur in FE/Node: Observer, Strategy, Factory, Adapter, Facade, Decorator, DI, Module.
*   Architectural styles: layered, hexagonal (ports and adapters), clean, event-driven, CQRS — and when each is overkill.
*   DDD-lite: bounded contexts, anti-corruption layer.
*   Frontend state machines (XState).

**Mastery check.** Justify an architectural style for a given system and name the costs you are accepting.

### 24 DSA & JS Utility Implementations
*   **TIME:** ~30 – 40 hours · continuous
*   **DEPTH:** Explain

You will still face coding rounds; the frontend/fullstack flavor is specific. Spread this across the whole journey — one rep a day.

**CORE TOPICS**
*   Core DSA: arrays/strings/hashmaps, two-pointer, sliding window, trees and graphs (the DOM is a tree), BFS/DFS, heaps, light DP, Big-O.
*   JS utilities: debounce, throttle, deepClone, deepEqual, curry, memoize, Promise.all/allSettled, a promise pool, EventEmitter, retry with backoff, LRU cache, flatten, groupBy.
*   Build-a-component reps: modal, tabs, autocomplete, infinite scroll — with accessibility.

**Mastery check.** Implement any common JS utility from scratch while narrating its complexity.

### 25 Behavioral, Communication & Leadership
*   **TIME:** ~12 – 16 hours · continuous
*   **DEPTH:** Architect

Architect loops weigh this near half. Technical brilliance without it fails the loop.

**CORE TOPICS**
*   A stories matrix: eight to ten quantified STAR stories, each tagged to leadership, conflict, failure, ambiguity, and impact.
*   Driving decisions; writing ADRs and RFCs.
*   Influence and disagree-and-commit; communicating risk upward.
*   Mentoring and raising the bar.

**Mastery check.** Tell any of your stories in two minutes and walk through one architecture decision record end-to-end.

---

## A Closing Word

You already hold the rare combination this path is built around: real React and TypeScript depth, real Node, and production Electron. Few people can architect across all three. Your work here is not to learn everything from nothing — it is to push your daily knowledge down to its internals, to become fluent in system design and the language of trade-offs, and to turn your desktop experience into a clear, deliberate advantage.

Cycle this codex. Keep it nearby. Plan each stretch of learning against it, return to the modules you have not yet made your own, and always — always — answer out loud.
