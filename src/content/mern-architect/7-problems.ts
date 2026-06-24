import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 7 (React 19, RSC & Server-Driven UI).
// The grader runs without a DOM, so these target the JS LOGIC behind React 19 /
// React Server Components / server-driven UI: the serialization (Flight) boundary,
// module directives, form-data handling, action state, optimistic updates, server
// actions, cache revalidation, Suspense-style async tree resolution, streamed-chunk
// assembly, and client/server boundary detection — all runtime-gradable.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'is-serializable',
    title: 'Can a value cross the RSC boundary? (Flight serializability)',
    difficulty: 'Hard',
    tags: ['rsc', 'serialization', 'flight'],
    prompt:
      "React Server Components serialize data through the Flight format to send it from the server to the client. Implement `isSerializable(value)` returning `true` if the value can cross the boundary. RULE: ALLOW primitives (`string`, `number`, `boolean`, `null`), plain objects and arrays (recurse into their values), and the built-ins `Date`, `Map`, `Set` (recurse into the contents of Maps/Sets). REJECT functions, symbols, `undefined`, and class instances (any non-plain object that isn't a Date/Map/Set). Recurse so a plain object containing a function is rejected.",
    examples: [
      {
        input: "isSerializable({ a: 1, when: new Date(0), tags: new Set(['x']) })",
        output: 'true',
      },
      { input: 'isSerializable({ run: () => {} })', output: 'false' },
    ],
    hints: [
      'Handle `null` first (typeof null === "object"). Reject `undefined`, `function`, and `symbol`.',
      'Allow `Date` directly; for `Map`/`Set`, recurse into every value (and Map keys) via the iterator.',
      'A plain object is one whose prototype is `Object.prototype` or `null`; anything else (a class instance) is rejected. Recurse into arrays and plain-object values.',
    ],
    starterCode: `function isSerializable(value) {
  // return true if value can cross the server→client boundary
}`,
    solution: `function isSerializable(value) {
  if (value === null) return true;
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return true;
  if (t === 'undefined' || t === 'function' || t === 'symbol' || t === 'bigint') return false;
  // t === 'object'
  if (value instanceof Date) return true;
  if (value instanceof Set) {
    for (const v of value) if (!isSerializable(v)) return false;
    return true;
  }
  if (value instanceof Map) {
    for (const [k, v] of value) {
      if (!isSerializable(k)) return false;
      if (!isSerializable(v)) return false;
    }
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((v) => isSerializable(v));
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return false; // class instance
  for (const key in value) {
    if (!isSerializable(value[key])) return false;
  }
  return true;
}`,
    tests: `class Point { constructor(x) { this.x = x; } }
assertEqual(isSerializable({ a: 1, b: 'two', c: true, d: null }), true, 'primitives + plain object');
assertEqual(isSerializable({ when: new Date(0), m: new Map([['k', 1]]), s: new Set([1, 2]) }), true, 'Date/Map/Set are serializable');
assertEqual(isSerializable({ run: () => {} }), false, 'function rejected');
assertEqual(isSerializable(new Point(3)), false, 'class instance rejected');
assertEqual(isSerializable(new Set([1, () => {}])), false, 'recurses into Set contents');
assertEqual(isSerializable([1, [2, { ok: true }]]), true, 'nested arrays/objects of primitives');`,
  },

  {
    id: 'detect-directive',
    title: 'Detect a module directive',
    difficulty: 'Medium',
    tags: ['rsc', 'directives', 'use-client'],
    prompt:
      "React decides where a module runs by its leading directive. Implement `detectDirective(source)` that returns `'use client'`, `'use server'`, or `null`. The directive must be the FIRST statement of the module: a bare string literal, ignoring leading blank lines and comments (`// ...` and `/* ... */`). If the first real statement isn't one of those directives, return `null`.",
    examples: [
      { input: "detectDirective(\"'use client';\\nimport x\")", output: "'use client'" },
      { input: "detectDirective(\"// note\\n'use server'\")", output: "'use server'" },
      { input: "detectDirective('const x = 1')", output: 'null' },
    ],
    hints: [
      'Strip leading whitespace, blank lines, `//` line comments and `/* */` block comments before inspecting the first token.',
      'Match a leading single- or double-quoted string literal at the very start of the remaining source.',
      'Compare the literal’s inner text to the two known directives; otherwise return null.',
    ],
    starterCode: `function detectDirective(source) {
  // return 'use client' | 'use server' | null
}`,
    solution: `function detectDirective(source) {
  let src = source;
  // Strip leading whitespace and comments repeatedly.
  while (true) {
    const before = src;
    src = src.replace(/^\\s+/, '');
    src = src.replace(/^\\/\\/[^\\n]*/, '');
    src = src.replace(/^\\/\\*[\\s\\S]*?\\*\\//, '');
    if (src === before) break;
  }
  const m = src.match(/^(['"])((?:\\\\.|(?!\\1).)*)\\1/);
  if (!m) return null;
  const directive = m[2];
  if (directive === 'use client' || directive === 'use server') return directive;
  return null;
}`,
    tests: `assertEqual(detectDirective("'use client';\\nimport React from 'react';"), 'use client', 'leading use client');
assertEqual(detectDirective('// banner\\n\\n  "use server"\\nexport async function act() {}'), 'use server', 'skips comments/blank lines');
assertEqual(detectDirective('const x = 1;\\n"use client";'), null, 'directive must be first statement');
assertEqual(detectDirective("'just a string'\\nfoo()"), null, 'unrelated leading literal → null');`,
  },

  {
    id: 'parse-form-data',
    title: 'Parse FormData entries',
    difficulty: 'Medium',
    tags: ['forms', 'server-actions', 'formdata'],
    prompt:
      "Server Actions receive a `FormData` object, often iterated as `[name, value]` pairs. Implement `parseFormData(entries)` that builds a plain object: a name seen once maps to its value; a name seen multiple times collects its values into an array in arrival order.",
    examples: [
      {
        input: "parseFormData([['email','a@x'], ['tag','x'], ['tag','y']])",
        output: "{ email: 'a@x', tag: ['x', 'y'] }",
      },
    ],
    hints: [
      'Iterate the entries in order, tracking how many times each name has appeared.',
      'On the second occurrence of a name, convert the existing scalar into an array, then push.',
      'A name that appears once stays a scalar (not a length-1 array).',
    ],
    starterCode: `function parseFormData(entries) {
  // return an object; repeated names → array in order
}`,
    solution: `function parseFormData(entries) {
  const out = {};
  for (const [name, value] of entries) {
    if (!(name in out)) {
      out[name] = value;
    } else if (Array.isArray(out[name])) {
      out[name].push(value);
    } else {
      out[name] = [out[name], value];
    }
  }
  return out;
}`,
    tests: `assertEqual(
  parseFormData([['email', 'a@x.com'], ['tag', 'x'], ['tag', 'y'], ['tag', 'z']]),
  { email: 'a@x.com', tag: ['x', 'y', 'z'] },
  'repeated names collect into an array in order',
);
assertEqual(parseFormData([['name', 'Ada']]), { name: 'Ada' }, 'single value stays scalar');
assertEqual(parseFormData([]), {}, 'empty entries → empty object');`,
  },

  {
    id: 'use-action-state',
    title: 'Implement useActionState',
    difficulty: 'Medium',
    tags: ['react-19', 'actions', 'state', 'async'],
    prompt:
      "React 19's `useActionState` threads a reducer's previous state into the next dispatch. Implement `useActionState(reducer, initial)` returning `[getState, dispatch]`. `getState()` returns the current state; `dispatch(payload)` calls `reducer(prevState, payload)`, stores the (possibly awaited) result as the new state, and resolves. Support both sync and async reducers.",
    examples: [
      {
        input: 'reducer = (prev, n) => prev + n; initial = 0; dispatch(5); dispatch(2)',
        output: 'getState() === 7',
      },
    ],
    hints: [
      'Keep `state` in a closure; `getState` just returns it.',
      'Make `dispatch` async and `await reducer(state, payload)` so async reducers work too.',
      'Assign the awaited result back to `state` before resolving.',
    ],
    starterCode: `function useActionState(reducer, initial) {
  // return [getState, dispatch]
}`,
    solution: `function useActionState(reducer, initial) {
  let state = initial;
  const getState = () => state;
  const dispatch = async (payload) => {
    state = await reducer(state, payload);
    return state;
  };
  return [getState, dispatch];
}`,
    tests: `const [getCount, addCount] = useActionState((prev, n) => prev + n, 0);
await addCount(5);
await addCount(2);
assertEqual(getCount(), 7, 'sync reducer threads previous state');

const [getName, setName] = useActionState(async (prev, next) => {
  await Promise.resolve();
  return next.toUpperCase();
}, 'anon');
await setName('ada');
assertEqual(getName(), 'ADA', 'async reducer is awaited');`,
  },

  {
    id: 'apply-optimistic',
    title: 'Apply an optimistic update',
    difficulty: 'Easy',
    tags: ['react-19', 'use-optimistic', 'immutability'],
    prompt:
      "React 19's `useOptimistic` shows a predicted state immediately while the real action is pending. Implement `applyOptimistic(base, optimistic, reducer)` that returns `reducer(base, optimistic)` WITHOUT mutating `base`. The reducer is expected to return a fresh value.",
    examples: [
      {
        input: 'base=[{id:1}], optimistic={id:2}, reducer=(s,m)=>[...s,m]',
        output: '[{id:1},{id:2}] and base is unchanged',
      },
    ],
    hints: [
      'Just return `reducer(base, optimistic)` — the reducer owns the merge logic.',
      'Do not push/splice into `base`; rely on the reducer producing a new structure.',
      'Verify `base` still has its original length/contents after the call.',
    ],
    starterCode: `function applyOptimistic(base, optimistic, reducer) {
  // return the optimistic state without mutating base
}`,
    solution: `function applyOptimistic(base, optimistic, reducer) {
  return reducer(base, optimistic);
}`,
    tests: `const base = [{ id: 1, text: 'real' }];
const next = applyOptimistic(base, { id: 2, text: 'pending' }, (state, msg) => [...state, msg]);
assertEqual(next, [{ id: 1, text: 'real' }, { id: 2, text: 'pending' }], 'optimistic item appended');
assertEqual(base, [{ id: 1, text: 'real' }], 'base array is not mutated');

const counter = applyOptimistic(5, 3, (s, delta) => s + delta);
assertEqual(counter, 8, 'works with non-array state too');`,
  },

  {
    id: 'create-server-action',
    title: 'Simulate a server action with a call log',
    difficulty: 'Medium',
    tags: ['server-actions', 'rpc', 'async'],
    prompt:
      "A Server Action is an async function the client can call like an RPC. Implement `createServerAction(impl)` returning `{ callable, log }`. Each invocation `callable(...args)` pushes the args array onto `log`, then resolves to `await impl(...args)`. The log records every call in order.",
    examples: [
      {
        input: 'impl = async (a, b) => a + b; callable(2, 3)',
        output: 'resolves 5; log === [[2, 3]]',
      },
    ],
    hints: [
      'Keep a `log` array in the closure and expose it on the returned object.',
      'Make `callable` async; push `[...args]` (a copy) before awaiting.',
      'Return `await impl(...args)` so async impls resolve correctly.',
    ],
    starterCode: `function createServerAction(impl) {
  // return { callable, log }
}`,
    solution: `function createServerAction(impl) {
  const log = [];
  const callable = async (...args) => {
    log.push([...args]);
    return await impl(...args);
  };
  return { callable, log };
}`,
    tests: `const { callable, log } = createServerAction(async (a, b) => {
  await Promise.resolve();
  return a + b;
});
const r1 = await callable(2, 3);
const r2 = await callable(10, 1);
assertEqual(r1, 5, 'resolves the impl result');
assertEqual(r2, 11, 'second call result');
assertEqual(log, [[2, 3], [10, 1]], 'records every call in order');`,
  },

  {
    id: 'revalidate-tag',
    title: 'Revalidate a tagged cache',
    difficulty: 'Medium',
    tags: ['caching', 'revalidation', 'next'],
    prompt:
      "Next.js `revalidateTag` purges every cache entry associated with a tag. Each cache entry is `{ key, tags, value }`. Implement `revalidateTag(cache, tag)` that returns a NEW array containing only the entries whose `tags` do NOT include `tag` (preserving order). Do not mutate the input.",
    examples: [
      {
        input: "revalidateTag([{key:'a',tags:['x'],value:1},{key:'b',tags:['y'],value:2}], 'x')",
        output: "[{ key:'b', tags:['y'], value:2 }]",
      },
    ],
    hints: [
      'Use `filter` so the original array is left untouched.',
      'Keep an entry when `entry.tags.includes(tag)` is false.',
      'Default a missing `tags` to an empty array so it survives.',
    ],
    starterCode: `function revalidateTag(cache, tag) {
  // return surviving entries (those NOT tagged with tag)
}`,
    solution: `function revalidateTag(cache, tag) {
  return cache.filter((entry) => !(entry.tags || []).includes(tag));
}`,
    tests: `const cache = [
  { key: 'a', tags: ['products', 'home'], value: 1 },
  { key: 'b', tags: ['user'], value: 2 },
  { key: 'c', tags: ['products'], value: 3 },
];
const survivors = revalidateTag(cache, 'products');
assertEqual(survivors, [{ key: 'b', tags: ['user'], value: 2 }], 'purges all entries tagged products');
assertEqual(cache.length, 3, 'original cache is not mutated');
assertEqual(revalidateTag(cache, 'missing').length, 3, 'unknown tag purges nothing');`,
  },

  {
    id: 'resolve-tree',
    title: 'Resolve a tree of promises (Suspense data)',
    difficulty: 'Hard',
    tags: ['suspense', 'async', 'rsc', 'tree'],
    prompt:
      "An RSC payload can contain promises that must all settle before render. Implement async `resolveTree(node)` that deeply resolves every Promise inside a nested structure of plain objects and arrays, returning a fully-resolved copy. Primitives pass through; promises are awaited; objects/arrays are recursed (and any promise nested inside a resolved value is resolved too).",
    examples: [
      {
        input: 'resolveTree({ user: Promise.resolve({ name: Promise.resolve("Ada") }) })',
        output: '{ user: { name: "Ada" } }',
      },
    ],
    hints: [
      'Await the node first (await on a non-promise is a no-op) so a promise resolving to an object gets recursed.',
      'After awaiting, if it’s an array map each element through `resolveTree` (await all).',
      'If it’s a plain object, resolve each value; otherwise return the primitive as-is.',
    ],
    starterCode: `async function resolveTree(node) {
  // deeply await every Promise in the structure
}`,
    solution: `async function resolveTree(node) {
  const resolved = await node;
  if (resolved === null || typeof resolved !== 'object') return resolved;
  if (Array.isArray(resolved)) {
    return Promise.all(resolved.map((item) => resolveTree(item)));
  }
  const out = {};
  for (const key in resolved) {
    out[key] = await resolveTree(resolved[key]);
  }
  return out;
}`,
    tests: `const tree = {
  id: 1,
  user: Promise.resolve({ name: Promise.resolve('Ada'), roles: [Promise.resolve('admin'), 'user'] }),
  items: Promise.resolve([{ q: Promise.resolve(2) }]),
};
const out = await resolveTree(tree);
assertEqual(out, { id: 1, user: { name: 'Ada', roles: ['admin', 'user'] }, items: [{ q: 2 }] }, 'deeply resolves nested promises');
assertEqual(await resolveTree(Promise.resolve(42)), 42, 'top-level promise resolves');
assertEqual(await resolveTree('plain'), 'plain', 'primitive passes through');`,
  },

  {
    id: 'assemble-stream',
    title: 'Assemble out-of-order stream chunks',
    difficulty: 'Medium',
    tags: ['streaming', 'ssr', 'suspense'],
    prompt:
      "Streaming SSR flushes HTML chunks that can arrive out of order. Implement `assembleStream(chunks)` where each chunk is `{ seq, html }`. Return the concatenated `html` ordered by `seq` ascending (0, 1, 2, ...). Assume `seq` values are unique.",
    examples: [
      {
        input: "assembleStream([{seq:2,html:'c'},{seq:0,html:'a'},{seq:1,html:'b'}])",
        output: "'abc'",
      },
    ],
    hints: [
      'Sort a copy of the chunks by `seq` ascending.',
      'Map to `html` and join with an empty string.',
      'Avoid mutating the caller’s array (sort a copy).',
    ],
    starterCode: `function assembleStream(chunks) {
  // return html concatenated in seq order
}`,
    solution: `function assembleStream(chunks) {
  return [...chunks]
    .sort((a, b) => a.seq - b.seq)
    .map((c) => c.html)
    .join('');
}`,
    tests: `assertEqual(
  assembleStream([{ seq: 2, html: '<c>' }, { seq: 0, html: '<a>' }, { seq: 1, html: '<b>' }]),
  '<a><b><c>',
  'orders chunks by seq',
);
assertEqual(assembleStream([{ seq: 0, html: 'only' }]), 'only', 'single chunk');
assertEqual(assembleStream([]), '', 'empty stream → empty string');`,
  },

  {
    id: 'split-boundary',
    title: 'Find the client component boundaries',
    difficulty: 'Hard',
    tags: ['rsc', 'use-client', 'boundary', 'tree'],
    prompt:
      "In an RSC tree, a `'use client'` boundary is a client node whose parent is a server node — everything below it ships to the client. Implement `splitBoundary(tree)` returning the list of `type` names of those boundary roots, in pre-order. A node is `{ type, env: 'server' | 'client', children }`. Treat the root's implicit parent as a server. A client node nested inside another client node is NOT a new boundary.",
    examples: [
      {
        input: "Page(server) → [Layout(server) → [Counter(client)], Footer(server)]",
        output: "['Counter']",
      },
    ],
    hints: [
      'Walk the tree depth-first, tracking the parent’s env (start as "server").',
      'A node is a boundary root when its env is "client" AND its parent env is "server".',
      'Once inside a client subtree, descendants share env "client", so they are not new boundaries — pass the current node’s env down as the child’s parent env.',
    ],
    starterCode: `function splitBoundary(tree) {
  // return type names of client boundary roots, pre-order
}`,
    solution: `function splitBoundary(tree) {
  const roots = [];
  function walk(node, parentEnv) {
    const isBoundary = node.env === 'client' && parentEnv === 'server';
    if (isBoundary) roots.push(node.type);
    for (const child of node.children || []) {
      walk(child, node.env);
    }
  }
  walk(tree, 'server');
  return roots;
}`,
    tests: `const tree = {
  type: 'Page', env: 'server', children: [
    { type: 'Layout', env: 'server', children: [
      { type: 'Counter', env: 'client', children: [
        { type: 'Button', env: 'client', children: [] },
      ] },
    ] },
    { type: 'Sidebar', env: 'client', children: [] },
    { type: 'Footer', env: 'server', children: [] },
  ],
};
assertEqual(splitBoundary(tree), ['Counter', 'Sidebar'], 'client nodes under a server parent are boundaries; nested client is not');

const allServer = { type: 'A', env: 'server', children: [{ type: 'B', env: 'server', children: [] }] };
assertEqual(splitBoundary(allServer), [], 'no client nodes → no boundaries');

const rootClient = { type: 'Root', env: 'client', children: [] };
assertEqual(splitBoundary(rootClient), ['Root'], 'root client node (implicit server parent) is a boundary');`,
  },
];
