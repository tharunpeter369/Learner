import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 6 (State Management & Data Fetching).
// The grader runs in a Web Worker (no DOM), so these target the JS LOGIC behind
// state stores, reducers, immutable updates, entity normalization, request
// de-duplication/caching, optimistic updates, and middleware composition.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'create-store',
    title: 'Build a Redux-style store',
    difficulty: 'Medium',
    tags: ['state', 'store', 'reducer', 'pub-sub'],
    prompt:
      "State libraries wrap a reducer in a tiny store. Implement `createStore(reducer, initialState)` returning `{ getState, dispatch, subscribe }`. `dispatch(action)` runs the reducer to produce the next state, then calls every subscribed listener. `subscribe(listener)` returns an `unsubscribe()` function that detaches that listener.",
    examples: [
      {
        input:
          "store = createStore((s, a) => a.type==='inc' ? s+1 : s, 0); store.dispatch({type:'inc'})",
        output: 'store.getState() === 1, and any subscriber was notified',
      },
    ],
    hints: [
      'Keep the current state in a closure variable; `getState` just returns it.',
      'On `dispatch`, reassign state to `reducer(state, action)` then loop over listeners.',
      'Store listeners in an array (or Set); `subscribe` returns a function that removes the listener.',
    ],
    starterCode: `function createStore(reducer, initialState) {
  // return { getState, dispatch, subscribe }
}`,
    solution: `function createStore(reducer, initialState) {
  let state = initialState;
  const listeners = new Set();
  return {
    getState() {
      return state;
    },
    dispatch(action) {
      state = reducer(state, action);
      for (const listener of listeners) listener();
      return action;
    },
    subscribe(listener) {
      listeners.add(listener);
      return function unsubscribe() {
        listeners.delete(listener);
      };
    },
  };
}`,
    tests: `const reducer = (s, a) => (a.type === 'inc' ? s + 1 : a.type === 'dec' ? s - 1 : s);
const store = createStore(reducer, 0);
assertEqual(store.getState(), 0, 'starts at initial state');
let calls = 0;
const unsub = store.subscribe(() => { calls++; });
store.dispatch({ type: 'inc' });
store.dispatch({ type: 'inc' });
assertEqual(store.getState(), 2, 'dispatch updates state via reducer');
assertEqual(calls, 2, 'subscriber notified on each dispatch');
unsub();
store.dispatch({ type: 'inc' });
assertEqual(calls, 2, 'unsubscribed listener no longer called');
assertEqual(store.getState(), 3, 'state still updates after unsubscribe');`,
  },

  {
    id: 'combine-reducers',
    title: 'Combine slice reducers',
    difficulty: 'Medium',
    tags: ['reducer', 'state', 'composition'],
    prompt:
      "Large apps split state into slices, each with its own reducer. Implement `combineReducers(reducersMap)` returning a single root reducer `(state, action) => nextState`. For each key, run its slice reducer with the matching slice of state and the action, assembling the result back into one object (same key order as `reducersMap`).",
    examples: [
      {
        input:
          "combineReducers({ count: countReducer, user: userReducer })({count:0, user:null}, action)",
        output: '{ count: <countReducer result>, user: <userReducer result> }',
      },
    ],
    hints: [
      'Iterate the keys of `reducersMap` to preserve their order in the output.',
      'For each key, call its reducer with `state[key]` and the action.',
      'Build a fresh object so the original state is never mutated.',
    ],
    starterCode: `function combineReducers(reducersMap) {
  // return (state, action) => nextState
}`,
    solution: `function combineReducers(reducersMap) {
  return function rootReducer(state, action) {
    const next = {};
    for (const key in reducersMap) {
      next[key] = reducersMap[key](state ? state[key] : undefined, action);
    }
    return next;
  };
}`,
    tests: `const count = (s = 0, a) => (a.type === 'inc' ? s + 1 : s);
const items = (s = [], a) => (a.type === 'add' ? [...s, a.item] : s);
const root = combineReducers({ count, items });
const s1 = root({ count: 0, items: [] }, { type: 'inc' });
assertEqual(s1, { count: 1, items: [] }, 'routes action to the right slice');
const s2 = root(s1, { type: 'add', item: 'x' });
assertEqual(s2, { count: 1, items: ['x'] }, 'other slice untouched, key order preserved');
const s0 = root(undefined, { type: 'noop' });
assertEqual(s0, { count: 0, items: [] }, 'falls back to slice defaults');`,
  },

  {
    id: 'set-in',
    title: 'Immutable deep set',
    difficulty: 'Medium',
    tags: ['immutability', 'state', 'recursion'],
    prompt:
      "Immutable updates copy only what's on the path to a change. Implement `setIn(obj, path, value)` where `path` is an array of keys. Return a NEW object equal to `obj` but with `value` set at `path`, without mutating `obj` (or any object along the path).",
    examples: [
      {
        input: "setIn({a:{b:1}}, ['a','b'], 2)",
        output: '{ a: { b: 2 } } (original still { a: { b: 1 } })',
      },
    ],
    hints: [
      'Base case: an empty path means just return `value`.',
      'Shallow-copy the current level with `{ ...obj }`, then recurse into the first key.',
      'Use the recursive result for `path.slice(1)` on the nested object (default to `{}` if missing).',
    ],
    starterCode: `function setIn(obj, path, value) {
  // return a new object with value set at path
}`,
    solution: `function setIn(obj, path, value) {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  const copy = Array.isArray(obj) ? obj.slice() : { ...obj };
  copy[key] = setIn(obj ? obj[key] : undefined, rest, value);
  return copy;
}`,
    tests: `const original = { a: { b: { c: 1 } }, d: 9 };
const updated = setIn(original, ['a', 'b', 'c'], 2);
assertEqual(updated, { a: { b: { c: 2 } }, d: 9 }, 'sets the deep value');
assertEqual(original, { a: { b: { c: 1 } }, d: 9 }, 'original is not mutated');
assert(updated.a !== original.a, 'objects on the path are fresh copies');
assert(updated.d === original.d, 'untouched branches are shared (referentially equal)');
const created = setIn({}, ['x', 'y'], 5);
assertEqual(created, { x: { y: 5 } }, 'creates missing intermediate objects');`,
  },

  {
    id: 'normalize-entities',
    title: 'Normalize a list into an entity map',
    difficulty: 'Medium',
    tags: ['normalization', 'entities', 'state-shape'],
    prompt:
      "Normalized state stores entities by id for O(1) lookup. Implement `normalize(items, idKey)` returning `{ byId, allIds }` where `byId` maps each item's id to the item, and `allIds` lists ids in their original order. Later duplicates with the same id overwrite earlier ones but must NOT be added to `allIds` twice. Return the exact key order `{ byId, allIds }`.",
    examples: [
      {
        input: "normalize([{id:'a',n:1},{id:'b',n:2}], 'id')",
        output: "{ byId: { a:{id:'a',n:1}, b:{id:'b',n:2} }, allIds: ['a','b'] }",
      },
    ],
    hints: [
      'Build `byId` and `allIds` in one pass over `items`.',
      'Use `items[i][idKey]` as the entity id.',
      'Only push the id into `allIds` the first time you see it.',
    ],
    starterCode: `function normalize(items, idKey) {
  // return { byId, allIds }
}`,
    solution: `function normalize(items, idKey) {
  const byId = {};
  const allIds = [];
  for (const item of items) {
    const id = item[idKey];
    if (!(id in byId)) allIds.push(id);
    byId[id] = item;
  }
  return { byId, allIds };
}`,
    tests: `const r = normalize([{ id: 'a', n: 1 }, { id: 'b', n: 2 }], 'id');
assertEqual(
  r,
  { byId: { a: { id: 'a', n: 1 }, b: { id: 'b', n: 2 } }, allIds: ['a', 'b'] },
  'normalizes into byId + allIds',
);
const dup = normalize([{ id: 'a', n: 1 }, { id: 'a', n: 9 }], 'id');
assertEqual(dup.byId.a, { id: 'a', n: 9 }, 'later duplicate overwrites entity');
assertEqual(dup.allIds, ['a'], 'id appears once in allIds');
assertEqual(normalize([], 'id'), { byId: {}, allIds: [] }, 'empty input → empty shape');`,
  },

  {
    id: 'select-by-ids',
    title: 'Select entities by id list',
    difficulty: 'Easy',
    tags: ['selectors', 'entities', 'derived-state'],
    prompt:
      "Denormalizing turns an id list back into entities. Implement `selectByIds(byId, ids)` returning an array of the entities for `ids`, in the same order. Skip any id that has no entry in `byId`.",
    examples: [
      {
        input: "selectByIds({a:{id:'a'}, b:{id:'b'}}, ['b','a','z'])",
        output: "[{id:'b'}, {id:'a'}]",
      },
    ],
    hints: [
      'Map over `ids` to look each one up in `byId`.',
      'Filter out ids that are missing (no key in `byId`).',
      'Preserve the order given by `ids`, not the order of `byId`.',
    ],
    starterCode: `function selectByIds(byId, ids) {
  // return an array of entities, skipping missing ids
}`,
    solution: `function selectByIds(byId, ids) {
  const out = [];
  for (const id of ids) {
    if (id in byId) out.push(byId[id]);
  }
  return out;
}`,
    tests: `const byId = { a: { id: 'a', n: 1 }, b: { id: 'b', n: 2 }, c: { id: 'c', n: 3 } };
assertEqual(
  selectByIds(byId, ['b', 'a']),
  [{ id: 'b', n: 2 }, { id: 'a', n: 1 }],
  'returns entities in the requested order',
);
assertEqual(
  selectByIds(byId, ['a', 'zzz', 'c']),
  [{ id: 'a', n: 1 }, { id: 'c', n: 3 }],
  'skips missing ids',
);
assertEqual(selectByIds(byId, []), [], 'empty id list → empty array');`,
  },

  {
    id: 'dedupe-in-flight',
    title: 'De-duplicate in-flight requests',
    difficulty: 'Medium',
    tags: ['data-fetching', 'async', 'caching'],
    prompt:
      "Firing the same request many times wastes the network. Implement `dedupeInFlight(fetcher)` wrapping an async `fetcher(key)` so that concurrent calls with the SAME key share one in-flight promise (the underlying fetcher runs once). Once that promise settles (success OR failure), the shared entry is cleared so a later call re-fetches.",
    examples: [
      {
        input: "wrapped = dedupeInFlight(fetcher); wrapped('a'); wrapped('a')",
        output: 'fetcher called once; both calls resolve to the same value',
      },
    ],
    hints: [
      'Keep a `Map` from key → the pending promise.',
      'If a key is already in the map, return that promise instead of calling the fetcher again.',
      'Use `.finally(() => map.delete(key))` so the entry is cleared whether it resolves or rejects.',
    ],
    starterCode: `function dedupeInFlight(fetcher) {
  // return an async function (key) => result that shares in-flight promises
}`,
    solution: `function dedupeInFlight(fetcher) {
  const inFlight = new Map();
  return function (key) {
    if (inFlight.has(key)) return inFlight.get(key);
    const promise = Promise.resolve()
      .then(() => fetcher(key))
      .finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}`,
    tests: `let calls = 0;
const fetcher = (key) => Promise.resolve().then(() => { calls++; return 'v:' + key; });
const wrapped = dedupeInFlight(fetcher);
const [a1, a2] = await Promise.all([wrapped('a'), wrapped('a')]);
assertEqual(calls, 1, 'concurrent same-key calls share one fetcher call');
assertEqual([a1, a2], ['v:a', 'v:a'], 'both callers get the same resolved value');
const a3 = await wrapped('a');
assertEqual(calls, 2, 'after settling, a later call re-fetches');
assertEqual(a3, 'v:a', 'refetch returns a fresh value');
let failCalls = 0;
const failing = dedupeInFlight(() => Promise.reject(new Error('boom')).catch((e) => { failCalls++; throw e; }));
let threw = false;
try { await failing('x'); } catch { threw = true; }
assert(threw, 'rejection still propagates');
try { await failing('x'); } catch { /* ignore */ }
assertEqual(failCalls, 2, 'failed request is not cached (entry cleared on rejection)');`,
  },

  {
    id: 'optimistic-update',
    title: 'Reconcile an optimistic update',
    difficulty: 'Medium',
    tags: ['optimistic-ui', 'data-fetching', 'immutability'],
    prompt:
      "Optimistic UIs show a temp item immediately, then swap it for the server's. Implement two pure helpers: `withOptimistic(list, tempItem)` returns a NEW list with `tempItem` appended; `reconcile(list, tempId, serverItem)` returns a NEW list where the item whose `id === tempId` is replaced by `serverItem`. If `serverItem.id` already exists elsewhere in the list, drop the temp slot instead of duplicating.",
    examples: [
      {
        input: "withOptimistic([{id:1}], {id:'tmp'}) → reconcile(_, 'tmp', {id:2})",
        output: '[{id:1}, {id:2}]',
      },
    ],
    hints: [
      '`withOptimistic` is just an immutable append: `[...list, tempItem]`.',
      'In `reconcile`, check whether `serverItem.id` already exists among the non-temp items.',
      'If it exists, filter out the temp item; otherwise map the temp slot to `serverItem`.',
    ],
    starterCode: `function withOptimistic(list, tempItem) {
  // return a new list with tempItem appended
}

function reconcile(list, tempId, serverItem) {
  // replace the temp item with serverItem (dedup if it already exists)
}`,
    solution: `function withOptimistic(list, tempItem) {
  return [...list, tempItem];
}

function reconcile(list, tempId, serverItem) {
  const existsElsewhere = list.some(
    (item) => item.id !== tempId && item.id === serverItem.id,
  );
  if (existsElsewhere) {
    return list.filter((item) => item.id !== tempId);
  }
  return list.map((item) => (item.id === tempId ? serverItem : item));
}`,
    tests: `const base = [{ id: 1, t: 'a' }];
const optimistic = withOptimistic(base, { id: 'tmp', t: 'b' });
assertEqual(optimistic, [{ id: 1, t: 'a' }, { id: 'tmp', t: 'b' }], 'appends temp item');
assertEqual(base, [{ id: 1, t: 'a' }], 'original list not mutated');
const reconciled = reconcile(optimistic, 'tmp', { id: 2, t: 'b' });
assertEqual(reconciled, [{ id: 1, t: 'a' }, { id: 2, t: 'b' }], 'swaps temp → server item');
const withDup = [{ id: 1 }, { id: 'tmp' }, { id: 2 }];
assertEqual(
  reconcile(withDup, 'tmp', { id: 2 }),
  [{ id: 1 }, { id: 2 }],
  'drops temp slot when server id already present',
);`,
  },

  {
    id: 'merge-cursor-page',
    title: 'Merge a paginated page',
    difficulty: 'Medium',
    tags: ['pagination', 'normalization', 'data-fetching'],
    prompt:
      "Infinite lists merge each fetched page into accumulated state. Implement `mergeCursorPage(existingIds, existingById, page, idKey)` returning `{ byId, order }`. Upsert every entity in `page` into a copy of `existingById`, and append only ids NOT already in `order` (preserving existing order, then new ids in page order). Return key order `{ byId, order }`.",
    examples: [
      {
        input: "mergeCursorPage(['a'], {a:{id:'a'}}, [{id:'b'},{id:'a'}], 'id')",
        output: "{ byId:{a, b}, order:['a','b'] }",
      },
    ],
    hints: [
      'Copy `existingById` (`{ ...existingById }`) and start `order` from a copy of `existingIds`.',
      'Track seen ids with a `Set` built from `existingIds` for O(1) appends.',
      'For each page item: upsert into `byId`, and push its id to `order` only if not seen.',
    ],
    starterCode: `function mergeCursorPage(existingIds, existingById, page, idKey) {
  // return { byId, order }
}`,
    solution: `function mergeCursorPage(existingIds, existingById, page, idKey) {
  const byId = { ...existingById };
  const order = [...existingIds];
  const seen = new Set(existingIds);
  for (const item of page) {
    const id = item[idKey];
    byId[id] = item;
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  return { byId, order };
}`,
    tests: `const r = mergeCursorPage(
  ['a'],
  { a: { id: 'a', n: 1 } },
  [{ id: 'b', n: 2 }, { id: 'a', n: 99 }],
  'id',
);
assertEqual(
  r,
  { byId: { a: { id: 'a', n: 99 }, b: { id: 'b', n: 2 } }, order: ['a', 'b'] },
  'upserts entities and appends only new ids',
);
const empty = mergeCursorPage([], {}, [{ id: 'x', n: 1 }], 'id');
assertEqual(empty, { byId: { x: { id: 'x', n: 1 } }, order: ['x'] }, 'first page builds state');
const noPage = mergeCursorPage(['a'], { a: { id: 'a' } }, [], 'id');
assertEqual(noPage.order, ['a'], 'empty page leaves order unchanged');`,
  },

  {
    id: 'compose-middleware',
    title: 'Compose functions right-to-left',
    difficulty: 'Easy',
    tags: ['composition', 'middleware', 'functional'],
    prompt:
      "Middleware pipelines are built from right-to-left function composition. Implement `compose(...fns)` returning a function that applies the rightmost fn first and feeds each result leftward. `compose(f, g, h)(x)` must equal `f(g(h(x)))`. With no functions, return an identity function.",
    examples: [
      {
        input: "compose(x => x + 1, x => x * 2)(5)",
        output: '11  // (5 * 2) + 1',
      },
    ],
    hints: [
      'With zero functions, return `(x) => x`.',
      'Reduce the function list, wrapping so the next fn runs before the accumulated one.',
      'Order matters: the RIGHTMOST function receives the original argument first.',
    ],
    starterCode: `function compose(...fns) {
  // return a function that applies fns right-to-left
}`,
    solution: `function compose(...fns) {
  if (fns.length === 0) return (x) => x;
  return fns.reduce((a, b) => (...args) => a(b(...args)));
}`,
    tests: `const addOne = (x) => x + 1;
const double = (x) => x * 2;
assertEqual(compose(addOne, double)(5), 11, 'rightmost runs first: (5*2)+1');
assertEqual(compose(double, addOne)(5), 12, 'order matters: (5+1)*2');
assertEqual(compose()(42), 42, 'no functions → identity');
assertEqual(compose(addOne)(0), 1, 'single function');
const upper = (s) => s.toUpperCase();
const exclaim = (s) => s + '!';
assertEqual(compose(exclaim, upper)('hi'), 'HI!', 'composes string transforms');`,
  },

  {
    id: 'cached-fetcher',
    title: 'Build a stale-while-cached fetcher',
    difficulty: 'Hard',
    tags: ['data-fetching', 'caching', 'async', 'staleness'],
    prompt:
      "A cache layer serves fresh values and refetches stale ones. Implement `createCachedFetcher(fetcher, staleMs, clock)` returning `get(key)`. It returns the cached value if it was fetched within `staleMs` of the current `clock()` time; otherwise it calls `fetcher(key)`, stores the result with the fetch timestamp, and returns it. `clock()` returns a number (inject it for deterministic tests).",
    examples: [
      {
        input: "get('a') @ t=0, then get('a') @ t=50 with staleMs=100",
        output: 'fetcher called once; second call returns cached value',
      },
    ],
    hints: [
      'Cache `{ value, time }` per key in a `Map`.',
      "Fresh means `clock() - entry.time < staleMs`; return `entry.value` without refetching.",
      'On a miss/stale entry, `await fetcher(key)`, then record the value with `time = clock()`.',
    ],
    starterCode: `function createCachedFetcher(fetcher, staleMs, clock) {
  // return an async get(key) that caches by freshness
}`,
    solution: `function createCachedFetcher(fetcher, staleMs, clock) {
  const cache = new Map();
  return async function get(key) {
    const entry = cache.get(key);
    if (entry && clock() - entry.time < staleMs) {
      return entry.value;
    }
    const value = await fetcher(key);
    cache.set(key, { value, time: clock() });
    return value;
  };
}`,
    tests: `let now = 0;
let calls = 0;
const fetcher = (key) => Promise.resolve().then(() => { calls++; return 'v:' + key + ':' + calls; });
const get = createCachedFetcher(fetcher, 100, () => now);
const first = await get('a');
assertEqual(first, 'v:a:1', 'fetches on cache miss');
assertEqual(calls, 1, 'fetcher called once');
now = 50; // still fresh (50 < 100)
const cached = await get('a');
assertEqual(cached, 'v:a:1', 'returns cached value while fresh');
assertEqual(calls, 1, 'no refetch while fresh');
now = 200; // stale (200 - 0 >= 100... but last fetch time was 0)
const refetched = await get('a');
assertEqual(calls, 2, 'refetches once stale');
assertEqual(refetched, 'v:a:2', 'returns the fresh value after refetch');
const other = await get('b');
assertEqual(other, 'v:b:3', 'different keys cached independently');
assertEqual(calls, 3, 'new key triggers its own fetch');`,
  },
];
