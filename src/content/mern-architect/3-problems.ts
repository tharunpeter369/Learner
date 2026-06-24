import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 3 (Browser & Rendering Internals).
// The grader runs in a Web Worker (no DOM), so these target the JS LOGIC behind
// rendering — diffing, reconciliation, scheduling/batching, caching, the CSS
// cascade, templating, tree traversal — all runtime-gradable.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'diff-props',
    title: 'Diff two prop objects (reconciliation)',
    difficulty: 'Medium',
    tags: ['reconciliation', 'virtual-dom'],
    prompt:
      "When a framework re-renders an element, it diffs the old and new props to compute the minimal DOM update. Implement `diffProps(oldProps, newProps)` returning `{ set, remove }` — `set` holds props that are new or changed, `remove` lists keys that disappeared.",
    examples: [
      {
        input: "diffProps({ id:'a', class:'box', hidden:true }, { id:'a', class:'panel', title:'hi' })",
        output: "{ set: { class:'panel', title:'hi' }, remove: ['hidden'] }",
      },
    ],
    hints: [
      'Walk `newProps`: include any key whose value differs from `oldProps` (new or changed).',
      'Walk `oldProps`: any key missing from `newProps` goes in `remove`.',
      'Unchanged props should appear in neither list.',
    ],
    starterCode: `function diffProps(oldProps, newProps) {
  // return { set, remove }
}`,
    solution: `function diffProps(oldProps, newProps) {
  const set = {};
  const remove = [];
  for (const key in newProps) {
    if (newProps[key] !== oldProps[key]) set[key] = newProps[key];
  }
  for (const key in oldProps) {
    if (!(key in newProps)) remove.push(key);
  }
  return { set, remove };
}`,
    tests: `const r = diffProps({ id: 'a', class: 'box', hidden: true }, { id: 'a', class: 'panel', title: 'hi' });
assertEqual(r.set, { class: 'panel', title: 'hi' }, 'set has changed + new props');
assertEqual(r.remove, ['hidden'], 'remove lists dropped props');`,
  },

  {
    id: 'reconcile-keys',
    title: 'Reconcile a keyed list',
    difficulty: 'Medium',
    tags: ['reconciliation', 'keys'],
    prompt:
      "Frameworks use keys to tell which list items are new, gone, or reused across renders. Implement `reconcileKeys(oldKeys, newKeys)` returning `{ mounted, removed, kept }` (mounted = in new only, removed = in old only, kept = in both, in new-list order).",
    examples: [
      {
        input: "reconcileKeys(['a','b','c'], ['b','c','d','e'])",
        output: "{ mounted: ['d','e'], removed: ['a'], kept: ['b','c'] }",
      },
    ],
    hints: [
      'Put each list into a `Set` for O(1) membership checks.',
      'mounted = new keys not in the old set; removed = old keys not in the new set.',
      'kept = new keys that are also in the old set (preserves new order).',
    ],
    starterCode: `function reconcileKeys(oldKeys, newKeys) {
  // return { mounted, removed, kept }
}`,
    solution: `function reconcileKeys(oldKeys, newKeys) {
  const oldSet = new Set(oldKeys);
  const newSet = new Set(newKeys);
  return {
    mounted: newKeys.filter((k) => !oldSet.has(k)),
    removed: oldKeys.filter((k) => !newSet.has(k)),
    kept: newKeys.filter((k) => oldSet.has(k)),
  };
}`,
    tests: `const r = reconcileKeys(['a', 'b', 'c'], ['b', 'c', 'd', 'e']);
assertEqual(r.mounted, ['d', 'e'], 'new keys are mounted');
assertEqual(r.removed, ['a'], 'missing keys are removed');
assertEqual(r.kept, ['b', 'c'], 'shared keys are kept');`,
  },

  {
    id: 'microtask-batcher',
    title: 'Batch updates into one flush',
    difficulty: 'Medium',
    tags: ['scheduling', 'event-loop', 'batching'],
    prompt:
      "To avoid layout thrash, frameworks batch many state changes into ONE update per tick. Implement `createBatcher(flush)`: calling the returned `enqueue(id)` collects ids, de-duplicates them, and calls `flush(ids)` exactly once on the next microtask with the unique ids.",
    examples: [
      {
        input: "enqueue('a'); enqueue('a'); enqueue('b'); (await a tick)",
        output: "flush(['a', 'b']) called once",
      },
    ],
    hints: [
      'Collect ids in a `Set` (handles de-duplication).',
      'Use a `scheduled` flag so only the first call this tick queues the flush.',
      'Schedule with `Promise.resolve().then(...)` (a microtask); clear the set after flushing.',
    ],
    starterCode: `function createBatcher(flush) {
  // return an enqueue(id) function
}`,
    solution: `function createBatcher(flush) {
  const pending = new Set();
  let scheduled = false;
  return function enqueue(id) {
    pending.add(id);
    if (scheduled) return;
    scheduled = true;
    Promise.resolve().then(() => {
      scheduled = false;
      const ids = [...pending];
      pending.clear();
      flush(ids);
    });
  };
}`,
    tests: `let flushed = null;
let flushCount = 0;
const enqueue = createBatcher((ids) => { flushed = ids; flushCount++; });
enqueue('a'); enqueue('a'); enqueue('b');
assertEqual(flushCount, 0, 'does not flush synchronously');
await new Promise((r) => setTimeout(r, 0));
assertEqual(flushCount, 1, 'flushes exactly once per tick');
assertEqual(flushed, ['a', 'b'], 'flushes the de-duplicated ids');`,
  },

  {
    id: 'lru-cache',
    title: 'Implement an LRU cache',
    difficulty: 'Medium',
    tags: ['caching', 'data-structures'],
    prompt:
      "Browsers and apps cache with a size limit, evicting the Least-Recently-Used entry. Implement `LRUCache` with `get(key)` (returns the value or `-1`) and `put(key, value)`; reading or writing a key marks it most-recently-used, and exceeding `capacity` evicts the LRU entry.",
    examples: [
      {
        input: "cap 2: put(a,1); put(b,2); get(a); put(c,3)",
        output: "b is evicted (a was just used)",
      },
    ],
    hints: [
      'A `Map` preserves insertion order — treat the first key as least-recently-used.',
      'On access, `delete` then re-`set` the key to move it to the most-recent end.',
      'After `put`, if `size > capacity`, delete `map.keys().next().value`.',
    ],
    starterCode: `class LRUCache {
  constructor(capacity) {
    // your code here
  }
  get(key) {}
  put(key, value) {}
}`,
    solution: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      this.map.delete(this.map.keys().next().value);
    }
  }
}`,
    tests: `const lru = new LRUCache(2);
lru.put('a', 1);
lru.put('b', 2);
assertEqual(lru.get('a'), 1, 'returns a value');
lru.put('c', 3); // a was just used, so b is the LRU and gets evicted
assertEqual(lru.get('b'), -1, 'LRU entry (b) was evicted');
assertEqual(lru.get('c'), 3, 'c is present');
assertEqual(lru.get('a'), 1, 'a is still present');`,
  },

  {
    id: 'css-cascade',
    title: 'Resolve the CSS cascade',
    difficulty: 'Medium',
    tags: ['css', 'cascade', 'specificity'],
    prompt:
      "The browser resolves which rule wins for a property by specificity (and source order on ties). Implement `cascade(rules, prop)` returning the winning value for `prop`, or `null` if no rule sets it. Each rule is `{ specificity, props }`; later rules win ties.",
    examples: [
      {
        input: "cascade([{specificity:1,props:{color:'black'}}, {specificity:10,props:{color:'red'}}], 'color')",
        output: "'red'",
      },
    ],
    hints: [
      'Track the best value and the best specificity seen so far.',
      'Only consider rules that actually set `prop`.',
      'Use `>=` so a later rule with equal specificity overrides (source order).',
    ],
    starterCode: `function cascade(rules, prop) {
  // return the winning value, or null
}`,
    solution: `function cascade(rules, prop) {
  let best = null;
  let bestSpec = -1;
  for (const rule of rules) {
    if (prop in rule.props && rule.specificity >= bestSpec) {
      bestSpec = rule.specificity;
      best = rule.props[prop];
    }
  }
  return best;
}`,
    tests: `const rules = [
  { specificity: 1, props: { color: 'black', display: 'block' } },
  { specificity: 10, props: { color: 'red' } },
  { specificity: 5, props: { color: 'blue' } },
];
assertEqual(cascade(rules, 'color'), 'red', 'highest specificity wins');
assertEqual(cascade(rules, 'display'), 'block', 'only one rule sets it');
assertEqual(cascade(rules, 'margin'), null, 'unset property → null');`,
  },

  {
    id: 'interpolate-template',
    title: 'Render a string template',
    difficulty: 'Easy',
    tags: ['templating', 'rendering'],
    prompt:
      "Implement `interpolate(template, data)` that replaces every `{{key}}` placeholder with `data[key]` (coerced to a string). A placeholder whose key is missing becomes an empty string.",
    examples: [
      {
        input: "interpolate('Hi {{name}}, {{count}} new', { name:'Ada', count:3 })",
        output: "'Hi Ada, 3 new'",
      },
    ],
    hints: [
      'Match placeholders with a global regex that captures the word inside the double braces.',
      'Use `String.prototype.replace` with a function callback.',
      'In the callback, return `data[key]` as a string, or an empty string if the key is absent.',
    ],
    starterCode: `function interpolate(template, data) {
  // replace {{key}} with data[key]
}`,
    solution: `function interpolate(template, data) {
  return template.replace(/\\{\\{(\\w+)\\}\\}/g, (_, key) =>
    key in data ? String(data[key]) : '',
  );
}`,
    tests: `assertEqual(
  interpolate('Hi {{name}}, you have {{count}} messages', { name: 'Ada', count: 3 }),
  'Hi Ada, you have 3 messages',
  'fills placeholders',
);
assertEqual(interpolate('{{missing}} stays empty', {}), ' stays empty', 'missing key → empty string');`,
  },

  {
    id: 'selector-matches',
    title: 'Match a node against a selector',
    difficulty: 'Easy',
    tags: ['events', 'delegation', 'selectors'],
    prompt:
      "Event delegation checks whether the event target matches a selector. Implement `matches(node, selector)` for simple selectors: `#id`, `.class`, or a bare `tag`. A node looks like `{ tag, id, classList }`.",
    examples: [
      { input: "matches({tag:'button', id:'save', classList:['btn']}, '#save')", output: 'true' },
      { input: "matches({tag:'button', id:'save', classList:['btn']}, '.btn')", output: 'true' },
    ],
    hints: [
      "If the selector starts with `#`, compare `node.id` to the rest.",
      "If it starts with `.`, check `node.classList` includes the rest.",
      'Otherwise compare `node.tag` to the selector.',
    ],
    starterCode: `function matches(node, selector) {
  // support '#id', '.class', and 'tag'
}`,
    solution: `function matches(node, selector) {
  if (selector.startsWith('#')) return node.id === selector.slice(1);
  if (selector.startsWith('.')) return (node.classList || []).includes(selector.slice(1));
  return node.tag === selector;
}`,
    tests: `const node = { tag: 'button', id: 'save', classList: ['btn', 'primary'] };
assertEqual(matches(node, '#save'), true, 'id selector');
assertEqual(matches(node, '.primary'), true, 'class selector');
assertEqual(matches(node, 'button'), true, 'tag selector');
assertEqual(matches(node, '.danger'), false, 'non-matching class');`,
  },

  {
    id: 'flatten-dom-tree',
    title: 'Flatten a DOM tree (pre-order)',
    difficulty: 'Easy',
    tags: ['dom', 'tree', 'traversal'],
    prompt:
      "The DOM is a tree; many operations walk it depth-first. Implement `flattenTree(root)` returning every node's `value` in pre-order (parent before its children, children left-to-right). A node is `{ value, children }`.",
    examples: [
      {
        input: 'a tree: html → [head → [title], body → [h1, p]]',
        output: "['html', 'head', 'title', 'body', 'h1', 'p']",
      },
    ],
    hints: [
      'Start the result with the current node’s `value`.',
      'Recurse into each child and append its flattened result.',
      'Handle a missing/empty `children` array.',
    ],
    starterCode: `function flattenTree(root) {
  // return an array of values in pre-order
}`,
    solution: `function flattenTree(root) {
  const out = [root.value];
  for (const child of root.children || []) {
    out.push(...flattenTree(child));
  }
  return out;
}`,
    tests: `const tree = {
  value: 'html',
  children: [
    { value: 'head', children: [{ value: 'title', children: [] }] },
    { value: 'body', children: [{ value: 'h1', children: [] }, { value: 'p', children: [] }] },
  ],
};
assertEqual(flattenTree(tree), ['html', 'head', 'title', 'body', 'h1', 'p'], 'pre-order DOM walk');`,
  },

  {
    id: 'memoized-selector',
    title: 'Build a memoized selector',
    difficulty: 'Medium',
    tags: ['memoization', 'derived-state', 'performance'],
    prompt:
      "Derived state (e.g. a computed view) shouldn't recompute every render. Implement `createSelector(inputFns, compute)` — a reselect-style memoized selector. It runs each input fn on `state`; if all inputs are referentially equal to last time, it returns the cached result instead of calling `compute` again.",
    examples: [
      {
        input: 'same inputs across two calls',
        output: 'compute runs once; second call returns the cached value',
      },
    ],
    hints: [
      'Map `inputFns` over `state` to get the current input values.',
      'Compare each to the previous inputs with `===` (reference equality).',
      'If all match, return the cached result; otherwise recompute and cache.',
    ],
    starterCode: `function createSelector(inputFns, compute) {
  // return a function (state) => result, memoized on the inputs
}`,
    solution: `function createSelector(inputFns, compute) {
  let lastArgs = null;
  let lastResult;
  return function (state) {
    const args = inputFns.map((fn) => fn(state));
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => a === lastArgs[i])) {
      return lastResult;
    }
    lastArgs = args;
    lastResult = compute(...args);
    return lastResult;
  };
}`,
    tests: `let computeCount = 0;
const selectTotal = createSelector(
  [(s) => s.a, (s) => s.b],
  (a, b) => { computeCount++; return a + b; },
);
assertEqual(selectTotal({ a: 1, b: 2, other: 9 }), 3, 'computes the derived value');
selectTotal({ a: 1, b: 2, other: 100 }); // a + b unchanged → should use cache
assertEqual(computeCount, 1, 'no recompute when inputs are unchanged');
assertEqual(selectTotal({ a: 5, b: 2 }), 7, 'recomputes when an input changes');
assertEqual(computeCount, 2, 'recomputed exactly once more');`,
  },

  {
    id: 'parse-style',
    title: 'Parse an inline style string',
    difficulty: 'Easy',
    tags: ['cssom', 'parsing'],
    prompt:
      "The browser parses a `style` attribute string into a key→value map (CSSOM). Implement `parseStyle(css)` that turns `'color: red; font-size: 14px'` into `{ color: 'red', 'font-size': '14px' }`. Trim whitespace and ignore empty declarations.",
    examples: [
      { input: "parseStyle('color: red; font-size: 14px')", output: "{ color: 'red', 'font-size': '14px' }" },
      { input: "parseStyle('')", output: '{}' },
    ],
    hints: [
      "Split the string on `';'` to get declarations.",
      "Split each declaration on the first `':'` into property and value.",
      'Trim both, and skip declarations that are missing a property or value.',
    ],
    starterCode: `function parseStyle(css) {
  // return a { property: value } object
}`,
    solution: `function parseStyle(css) {
  const out = {};
  for (const decl of css.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (prop && value) out[prop] = value;
  }
  return out;
}`,
    tests: `assertEqual(
  parseStyle('color: red; font-size: 14px'),
  { color: 'red', 'font-size': '14px' },
  'parses declarations into a map',
);
assertEqual(parseStyle('  margin:0  '), { margin: '0' }, 'trims whitespace');
assertEqual(parseStyle(''), {}, 'empty string → empty object');`,
  },
];
