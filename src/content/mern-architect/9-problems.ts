import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 9 (Frontend System Design).
// The grader runs without a DOM, so these target the JS LOGIC behind the
// classic frontend system-design case studies — infinite-scroll feeds,
// search typeahead, realtime chat ordering, pub/sub, batching loaders,
// rate limiting, cursor pagination, and reconnect backoff.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'merge-feed-page',
    title: 'Merge a new feed page (infinite scroll)',
    difficulty: 'Medium',
    tags: ['feed', 'pagination', 'dedup'],
    prompt:
      "An infinite-scroll feed loads pages and appends them, but pages can overlap (a new item shifts everything). Implement `mergeFeedPage(existingIds, page, idKey)` that returns an array of the ids from `page` that are NOT already in `existingIds`, preserving `page` order. `page` is a list of item objects; read each id via `item[idKey]`.",
    examples: [
      {
        input: "mergeFeedPage(['p1','p2'], [{id:'p2'},{id:'p3'},{id:'p4'}], 'id')",
        output: "['p3', 'p4']",
      },
    ],
    hints: [
      'Put `existingIds` into a `Set` for O(1) membership checks.',
      'Map each page item to `item[idKey]` and keep only ids not in the set.',
      'Preserve the order in which ids appear in `page`.',
    ],
    starterCode: `function mergeFeedPage(existingIds, page, idKey) {
  // return an array of the NEW ids from page (dedup against existingIds)
}`,
    solution: `function mergeFeedPage(existingIds, page, idKey) {
  const seen = new Set(existingIds);
  const out = [];
  for (const item of page) {
    const id = item[idKey];
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}`,
    tests: `assertEqual(
  mergeFeedPage(['p1', 'p2'], [{ id: 'p2' }, { id: 'p3' }, { id: 'p4' }], 'id'),
  ['p3', 'p4'],
  'drops ids already in the feed, keeps new ones in order',
);
assertEqual(
  mergeFeedPage([], [{ id: 'a' }, { id: 'b' }], 'id'),
  ['a', 'b'],
  'empty existing → all new',
);
assertEqual(
  mergeFeedPage(['x'], [{ id: 'x' }, { id: 'y' }, { id: 'x' }], 'id'),
  ['y'],
  'also dedups duplicates within the page',
);`,
  },

  {
    id: 'latest-only',
    title: 'Accept only the latest response (typeahead)',
    difficulty: 'Medium',
    tags: ['typeahead', 'race-conditions', 'ordering'],
    prompt:
      "A search typeahead fires a request per keystroke; responses can arrive out of order, so a stale (earlier) response must never overwrite a newer one. Implement `latestOnly()` that returns a `run(seq, value)` function. `run` only applies `value` when `seq` is strictly greater than any `seq` seen before; in either case it returns the currently accepted value (initially `null`).",
    examples: [
      {
        input: "g=latestOnly(); g(1,'a'); g(3,'c'); g(2,'b')",
        output: "returns 'a', then 'c', then 'c' (seq 2 is stale, ignored)",
      },
    ],
    hints: [
      'Keep a closure variable for the highest `seq` accepted so far and the current value.',
      'Only update when `seq` is strictly greater than the stored max seq.',
      'Always return the current accepted value, whether or not you applied this one.',
    ],
    starterCode: `function latestOnly() {
  // return a function run(seq, value) => current accepted value
}`,
    solution: `function latestOnly() {
  let maxSeq = -Infinity;
  let current = null;
  return function run(seq, value) {
    if (seq > maxSeq) {
      maxSeq = seq;
      current = value;
    }
    return current;
  };
}`,
    tests: `const g = latestOnly();
assertEqual(g(1, 'a'), 'a', 'first response is accepted');
assertEqual(g(3, 'c'), 'c', 'newer seq is accepted');
assertEqual(g(2, 'b'), 'c', 'stale (lower seq) response is ignored');
assertEqual(g(4, 'd'), 'd', 'a higher seq again wins');`,
  },

  {
    id: 'ordered-flush',
    title: 'Flush chat messages in order',
    difficulty: 'Hard',
    tags: ['chat', 'ordering', 'realtime'],
    prompt:
      "A chat client buffers messages that may arrive out of order or with gaps. Given the `lastSeen` sequence number and a `buffer` of `{seq, text}` messages, implement `orderedFlush(lastSeen, buffer)` that returns the messages deliverable IN ORDER starting at `lastSeen + 1`, stopping at the first missing seq (a gap). Return an array of `{seq, text}` (keys in that order). Ignore messages with `seq <= lastSeen`.",
    examples: [
      {
        input: "orderedFlush(0, [{seq:1,text:'a'},{seq:3,text:'c'},{seq:2,text:'b'}])",
        output: "[{seq:1,text:'a'},{seq:2,text:'b'},{seq:3,text:'c'}]",
      },
      {
        input: "orderedFlush(0, [{seq:1,text:'a'},{seq:3,text:'c'}])",
        output: "[{seq:1,text:'a'}] (gap at seq 2 stops the flush)",
      },
    ],
    hints: [
      'Index the buffer by seq into a `Map` for O(1) lookup.',
      'Starting at `lastSeen + 1`, walk upward pulling consecutive seqs from the map.',
      'Stop as soon as the next seq is missing.',
    ],
    starterCode: `function orderedFlush(lastSeen, buffer) {
  // return the in-order deliverable [{seq, text}] starting at lastSeen + 1
}`,
    solution: `function orderedFlush(lastSeen, buffer) {
  const bySeq = new Map();
  for (const msg of buffer) {
    if (msg.seq > lastSeen) bySeq.set(msg.seq, msg);
  }
  const out = [];
  let next = lastSeen + 1;
  while (bySeq.has(next)) {
    const msg = bySeq.get(next);
    out.push({ seq: msg.seq, text: msg.text });
    next++;
  }
  return out;
}`,
    tests: `assertEqual(
  orderedFlush(0, [{ seq: 1, text: 'a' }, { seq: 3, text: 'c' }, { seq: 2, text: 'b' }]),
  [{ seq: 1, text: 'a' }, { seq: 2, text: 'b' }, { seq: 3, text: 'c' }],
  'reorders contiguous messages',
);
assertEqual(
  orderedFlush(0, [{ seq: 1, text: 'a' }, { seq: 3, text: 'c' }]),
  [{ seq: 1, text: 'a' }],
  'stops at the first gap',
);
assertEqual(
  orderedFlush(5, [{ seq: 4, text: 'old' }, { seq: 7, text: 'g' }]),
  [],
  'nothing deliverable: seq 6 missing, seq 4 already seen',
);`,
  },

  {
    id: 'create-emitter',
    title: 'Build a pub/sub event emitter',
    difficulty: 'Medium',
    tags: ['pub-sub', 'events', 'observer'],
    prompt:
      "A decoupled UI uses an event bus. Implement `createEmitter()` returning `{ on, off, emit }`. `on(event, fn)` subscribes and returns an unsubscribe function. `emit(event, ...args)` calls every handler for `event` with `args`. `off(event, fn)` removes a handler. Calling an unsubscribe (or `off`) must stop future deliveries to that handler.",
    examples: [
      {
        input: "const e=createEmitter(); e.on('tick', fn); e.emit('tick', 1)",
        output: "fn(1) is called",
      },
    ],
    hints: [
      'Store handlers in a `Map` from event name to an array (or `Set`) of functions.',
      '`on` should push the handler and return a closure that removes it.',
      '`emit` should iterate a snapshot of handlers so unsubscribing during emit is safe.',
    ],
    starterCode: `function createEmitter() {
  // return { on, off, emit }
}`,
    solution: `function createEmitter() {
  const handlers = new Map();
  function on(event, fn) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event).add(fn);
    return () => off(event, fn);
  }
  function off(event, fn) {
    const set = handlers.get(event);
    if (set) set.delete(fn);
  }
  function emit(event, ...args) {
    const set = handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) fn(...args);
  }
  return { on, off, emit };
}`,
    tests: `const e = createEmitter();
const calls = [];
const unsub = e.on('tick', (n) => calls.push(n));
e.on('tick', (n) => calls.push(n * 10));
e.emit('tick', 1);
assertEqual(calls, [1, 10], 'all handlers receive the event');
unsub();
e.emit('tick', 2);
assertEqual(calls, [1, 10, 20], 'unsubscribed handler no longer fires');
e.off('tick', () => {});
e.emit('missing');
assert(true, 'emitting an event with no handlers is a no-op');`,
  },

  {
    id: 'build-tree',
    title: 'Build a tree from flat nodes',
    difficulty: 'Medium',
    tags: ['tree', 'comments', 'data-structures'],
    prompt:
      "Threaded comments (and category menus) arrive as a flat list and must be nested for rendering. Given `flatNodes` of `{id, parentId}` (parentId `null` for roots), implement `buildTree(flatNodes)` returning the roots as `[{id, children:[...]}]`, where each node has exactly the keys `id` then `children` (in that order), preserving input order at every level.",
    examples: [
      {
        input: "buildTree([{id:1,parentId:null},{id:2,parentId:1},{id:3,parentId:1}])",
        output: "[{id:1, children:[{id:2,children:[]},{id:3,children:[]}]}]",
      },
    ],
    hints: [
      'First pass: create a node `{id, children:[]}` for every entry and index by id.',
      "Second pass: attach each node to its parent's `children`, or collect it as a root.",
      'Iterating the flat list in order keeps sibling order stable.',
    ],
    starterCode: `function buildTree(flatNodes) {
  // return nested roots [{ id, children: [...] }]
}`,
    solution: `function buildTree(flatNodes) {
  const byId = new Map();
  for (const n of flatNodes) {
    byId.set(n.id, { id: n.id, children: [] });
  }
  const roots = [];
  for (const n of flatNodes) {
    const node = byId.get(n.id);
    if (n.parentId == null) {
      roots.push(node);
    } else {
      const parent = byId.get(n.parentId);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  }
  return roots;
}`,
    tests: `assertEqual(
  buildTree([
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
    { id: 4, parentId: 2 },
  ]),
  [
    {
      id: 1,
      children: [
        { id: 2, children: [{ id: 4, children: [] }] },
        { id: 3, children: [] },
      ],
    },
  ],
  'nests children under parents, preserving order',
);
assertEqual(
  buildTree([{ id: 'a', parentId: null }, { id: 'b', parentId: null }]),
  [{ id: 'a', children: [] }, { id: 'b', children: [] }],
  'multiple roots',
);`,
  },

  {
    id: 'token-bucket',
    title: 'Rate limit with a token bucket',
    difficulty: 'Medium',
    tags: ['rate-limiting', 'token-bucket', 'throttling'],
    prompt:
      "Outgoing API calls (e.g. autosave, analytics) are rate-limited with a token bucket. Implement `tokenBucket(capacity, refillPerTick)` returning `{ tryRemove, tick }`. The bucket starts full (`capacity` tokens). `tryRemove()` consumes a token and returns `true` if one was available, else returns `false`. `tick()` adds `refillPerTick` tokens, capped at `capacity`.",
    examples: [
      {
        input: "b=tokenBucket(2,1); b.tryRemove(); b.tryRemove(); b.tryRemove()",
        output: "true, true, false (bucket of 2 is now empty)",
      },
    ],
    hints: [
      'Track a `tokens` count starting at `capacity`.',
      '`tryRemove` returns false when `tokens` is 0; otherwise decrement and return true.',
      '`tick` sets `tokens = Math.min(capacity, tokens + refillPerTick)`.',
    ],
    starterCode: `function tokenBucket(capacity, refillPerTick) {
  // return { tryRemove, tick }
}`,
    solution: `function tokenBucket(capacity, refillPerTick) {
  let tokens = capacity;
  function tryRemove() {
    if (tokens <= 0) return false;
    tokens -= 1;
    return true;
  }
  function tick() {
    tokens = Math.min(capacity, tokens + refillPerTick);
  }
  return { tryRemove, tick };
}`,
    tests: `const b = tokenBucket(2, 1);
assertEqual(b.tryRemove(), true, 'first token available');
assertEqual(b.tryRemove(), true, 'second token available');
assertEqual(b.tryRemove(), false, 'bucket empty → rejected');
b.tick();
assertEqual(b.tryRemove(), true, 'tick refilled one token');
assertEqual(b.tryRemove(), false, 'only one token was refilled');
b.tick();
b.tick();
b.tick();
let granted = 0;
if (b.tryRemove()) granted++;
if (b.tryRemove()) granted++;
if (b.tryRemove()) granted++;
assertEqual(granted, 2, 'refill is capped at capacity');`,
  },

  {
    id: 'create-data-loader',
    title: 'Batch loads into one call (DataLoader)',
    difficulty: 'Hard',
    tags: ['batching', 'async', 'dataloader'],
    prompt:
      "To avoid N+1 requests, the DataLoader pattern coalesces many `load(key)` calls in the same microtask tick into ONE `batchFn(keys)` call. Implement `createDataLoader(batchFn)` returning an object with `load(key)`. All keys requested before the next microtask are passed (in request order) to a single `batchFn(keys)`, which returns (sync or via a promise) an array of values in the same order; each `load` resolves with its key's value.",
    examples: [
      {
        input: "loader.load('a'); loader.load('b'); (one tick)",
        output: "batchFn(['a','b']) called once; promises resolve to a's and b's values",
      },
    ],
    hints: [
      'Collect pending `{ key, resolve }` entries in an array; schedule a flush with `Promise.resolve().then(...)` only on the first queued key this tick.',
      'On flush, snapshot and clear the queue, call `batchFn(keys)` once, then `await` its result.',
      'Resolve each pending promise with the value at its index.',
    ],
    starterCode: `function createDataLoader(batchFn) {
  // return { load(key) => Promise<value> } with per-tick batching
}`,
    solution: `function createDataLoader(batchFn) {
  let queue = [];
  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    Promise.resolve().then(async () => {
      const batch = queue;
      queue = [];
      scheduled = false;
      const keys = batch.map((b) => b.key);
      const values = await batchFn(keys);
      batch.forEach((b, i) => b.resolve(values[i]));
    });
  }
  function load(key) {
    return new Promise((resolve) => {
      queue.push({ key, resolve });
      schedule();
    });
  }
  return { load };
}`,
    tests: `let batchCalls = 0;
const loader = createDataLoader((keys) => {
  batchCalls++;
  return keys.map((k) => k.toUpperCase());
});
const [a, b, c] = await Promise.all([
  loader.load('a'),
  loader.load('b'),
  loader.load('c'),
]);
assertEqual([a, b, c], ['A', 'B', 'C'], 'each load resolves with its key value');
assertEqual(batchCalls, 1, 'three loads in one tick → batchFn called once');
const d = await loader.load('d');
assertEqual(d, 'D', 'a later tick resolves correctly');
assertEqual(batchCalls, 2, 'a separate tick triggers a new batch');`,
  },

  {
    id: 'backoff-with-jitter',
    title: 'Compute reconnect backoff with jitter',
    difficulty: 'Easy',
    tags: ['backoff', 'reconnect', 'websocket'],
    prompt:
      "A websocket client reconnects with exponential backoff plus 'full jitter' to avoid thundering-herd reconnect storms. Implement `backoffWithJitter(attempt, baseMs, capMs, rand)` that computes `delay = min(capMs, baseMs * 2 ** attempt)` then returns `rand() * delay`. `rand` is injected (returns a number in [0, 1)) so the result is deterministic in tests.",
    examples: [
      {
        input: "backoffWithJitter(3, 100, 5000, () => 0.5)",
        output: "400 (min(5000, 800) = 800, then 0.5 * 800)",
      },
    ],
    hints: [
      'Exponential term is `baseMs * Math.pow(2, attempt)`.',
      'Cap it with `Math.min(capMs, ...)` before applying jitter.',
      'Full jitter multiplies the capped delay by `rand()`.',
    ],
    starterCode: `function backoffWithJitter(attempt, baseMs, capMs, rand) {
  // return rand() * min(capMs, baseMs * 2 ** attempt)
}`,
    solution: `function backoffWithJitter(attempt, baseMs, capMs, rand) {
  const delay = Math.min(capMs, baseMs * Math.pow(2, attempt));
  return rand() * delay;
}`,
    tests: `assertEqual(
  backoffWithJitter(3, 100, 5000, () => 0.5),
  400,
  'min(5000, 800) then 0.5 jitter',
);
assertEqual(
  backoffWithJitter(10, 100, 5000, () => 1),
  5000,
  'exponential term is capped at capMs',
);
assertEqual(
  backoffWithJitter(0, 100, 5000, () => 0),
  0,
  'zero jitter → zero delay',
);`,
  },

  {
    id: 'paginate-cursor',
    title: 'Cursor-based pagination',
    difficulty: 'Medium',
    tags: ['pagination', 'cursor', 'api'],
    prompt:
      "Cursor pagination is stable under inserts (unlike offset pagination). Implement `paginateCursor(items, cursor, limit, idKey)` returning `{ items, nextCursor }`. Start AFTER the item whose id equals `cursor` (or from the beginning when `cursor` is `null`), take up to `limit` items, and set `nextCursor` to the id of the last returned item, or `null` if there are no more items after this page.",
    examples: [
      {
        input: "paginateCursor([{id:'a'},{id:'b'},{id:'c'}], null, 2, 'id')",
        output: "{ items:[{id:'a'},{id:'b'}], nextCursor:'b' }",
      },
      {
        input: "paginateCursor([{id:'a'},{id:'b'},{id:'c'}], 'b', 2, 'id')",
        output: "{ items:[{id:'c'}], nextCursor:null }",
      },
    ],
    hints: [
      'Find the start index: 0 when `cursor` is null, else the index after the matching id.',
      'Slice `limit` items from the start index.',
      "nextCursor is null when the slice reaches the end of `items`; otherwise the last item's id.",
    ],
    starterCode: `function paginateCursor(items, cursor, limit, idKey) {
  // return { items, nextCursor }
}`,
    solution: `function paginateCursor(items, cursor, limit, idKey) {
  let start = 0;
  if (cursor != null) {
    const idx = items.findIndex((it) => it[idKey] === cursor);
    start = idx === -1 ? items.length : idx + 1;
  }
  const end = start + limit;
  const page = items.slice(start, end);
  const hasMore = end < items.length && page.length > 0;
  const nextCursor = hasMore ? page[page.length - 1][idKey] : null;
  return { items: page, nextCursor };
}`,
    tests: `const data = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const first = paginateCursor(data, null, 2, 'id');
assertEqual(first, { items: [{ id: 'a' }, { id: 'b' }], nextCursor: 'b' }, 'first page from start');
const second = paginateCursor(data, 'b', 2, 'id');
assertEqual(second, { items: [{ id: 'c' }, { id: 'd' }], nextCursor: null }, 'final page → null cursor');
const empty = paginateCursor(data, 'd', 2, 'id');
assertEqual(empty, { items: [], nextCursor: null }, 'cursor at end → empty page');`,
  },

  {
    id: 'dedupe-by-id',
    title: 'De-duplicate feed items by id',
    difficulty: 'Easy',
    tags: ['feed', 'dedup', 'normalize'],
    prompt:
      "When paginated feed responses overlap, the merged list can contain the same item twice. Implement `dedupeById(items, idKey)` that returns a new array keeping the FIRST occurrence of each id and preserving order. Each item is an object whose id is read via `item[idKey]`.",
    examples: [
      {
        input: "dedupeById([{id:1,v:'a'},{id:2,v:'b'},{id:1,v:'c'}], 'id')",
        output: "[{id:1,v:'a'},{id:2,v:'b'}]",
      },
    ],
    hints: [
      'Track ids you have already emitted in a `Set`.',
      'Skip an item when its id is already in the set.',
      'Keeping the first occurrence means you add the id to the set the first time you see it.',
    ],
    starterCode: `function dedupeById(items, idKey) {
  // return items with duplicate ids removed (keep the first)
}`,
    solution: `function dedupeById(items, idKey) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const id = item[idKey];
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}`,
    tests: `assertEqual(
  dedupeById([{ id: 1, v: 'a' }, { id: 2, v: 'b' }, { id: 1, v: 'c' }], 'id'),
  [{ id: 1, v: 'a' }, { id: 2, v: 'b' }],
  'keeps the first occurrence of each id',
);
assertEqual(
  dedupeById([], 'id'),
  [],
  'empty input → empty output',
);
assertEqual(
  dedupeById([{ k: 'x' }, { k: 'x' }, { k: 'y' }], 'k'),
  [{ k: 'x' }, { k: 'y' }],
  'works with a custom id key',
);`,
  },
];
