import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 5 (React Internals & Concurrent Rendering).
// The grader runs without a DOM, so these target the JS LOGIC behind React's
// runtime — hooks, the update queue, bailout/memoization, the concurrent
// scheduler (priority, time-slicing), and the lane bitmask model.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'shallow-equal',
    title: 'Shallow-compare two objects',
    difficulty: 'Easy',
    tags: ['memoization', 'react-memo', 'equality'],
    prompt:
      "`React.memo` and `PureComponent` skip re-renders by shallow-comparing props. Implement `shallowEqual(a, b)`: return `true` only when both objects have the same set of keys AND every value is referentially equal (`===`). The same reference is trivially equal.",
    examples: [
      { input: "shallowEqual({ x: 1, y: 2 }, { x: 1, y: 2 })", output: 'true' },
      { input: "shallowEqual({ x: 1 }, { x: 1, y: 2 })", output: 'false' },
    ],
    hints: [
      'If `a === b`, return true immediately.',
      'Compare key counts first; differing counts can never be shallow-equal.',
      'Walk one object’s keys and check each value matches the other with `===`.',
    ],
    starterCode: `function shallowEqual(a, b) {
  // return true if a and b are shallow-equal
}`,
    solution: `function shallowEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}`,
    tests: `assert(shallowEqual({ x: 1, y: 2 }, { x: 1, y: 2 }) === true, 'equal flat objects');
assert(shallowEqual({ x: 1 }, { x: 1, y: 2 }) === false, 'extra key breaks equality');
const obj = { id: 1 };
assert(shallowEqual({ data: obj }, { data: obj }) === true, 'same reference is equal');
assert(shallowEqual({ data: { id: 1 } }, { data: { id: 1 } }) === false, 'nested objects compared by reference');`,
  },

  {
    id: 'deps-changed',
    title: 'Detect dependency-array changes',
    difficulty: 'Easy',
    tags: ['hooks', 'useEffect', 'dependencies'],
    prompt:
      "`useEffect`/`useMemo` re-run when their dependency array changes. Implement `depsChanged(prev, next)`: return `true` (changed) when `prev` is `null`/`undefined` (first run), when the lengths differ, or when ANY element differs by `===`. Otherwise return `false`.",
    examples: [
      { input: "depsChanged(null, [1, 2])", output: 'true' },
      { input: "depsChanged([1, 2], [1, 2])", output: 'false' },
      { input: "depsChanged([1, 2], [1, 3])", output: 'true' },
    ],
    hints: [
      'A null/undefined `prev` means the effect has never run — always changed.',
      'If the array lengths differ, treat it as changed.',
      'Otherwise compare element-by-element with `===`; any mismatch is a change.',
    ],
    starterCode: `function depsChanged(prev, next) {
  // return true if the deps changed (or it's the first run)
}`,
    solution: `function depsChanged(prev, next) {
  if (prev === null || prev === undefined) return true;
  if (prev.length !== next.length) return true;
  for (let i = 0; i < next.length; i++) {
    if (!Object.is(prev[i], next[i])) return true;
  }
  return false;
}`,
    tests: `assert(depsChanged(null, [1, 2]) === true, 'first run is always changed');
assert(depsChanged(undefined, []) === true, 'undefined prev is changed');
assert(depsChanged([1, 2], [1, 2]) === false, 'identical deps are unchanged');
assert(depsChanged([1, 2], [1, 3]) === true, 'differing element is a change');
assert(depsChanged([1], [1, 2]) === true, 'differing length is a change');`,
  },

  {
    id: 'process-update-queue',
    title: 'Process a state update queue',
    difficulty: 'Medium',
    tags: ['hooks', 'useReducer', 'state'],
    prompt:
      "React stores pending `setState` calls in a queue and applies them in order. Each update is either a replacement value or an updater function `(prev) => next`. Implement `processUpdateQueue(base, updates)` that folds the queue over `base` and returns the final state.",
    examples: [
      {
        input: "processUpdateQueue(0, [1, (p) => p + 5, (p) => p * 2])",
        output: '12',
        explanation: '0 → 1 → 6 → 12',
      },
    ],
    hints: [
      'Start from `base` and reduce across the updates.',
      'If an update is a function, call it with the current state; otherwise use it as the next state directly.',
      'The order of the queue matters — process left to right.',
    ],
    starterCode: `function processUpdateQueue(base, updates) {
  // fold the updates over base
}`,
    solution: `function processUpdateQueue(base, updates) {
  let state = base;
  for (const update of updates) {
    state = typeof update === 'function' ? update(state) : update;
  }
  return state;
}`,
    tests: `assertEqual(
  processUpdateQueue(0, [1, (p) => p + 5, (p) => p * 2]),
  12,
  'mixes values and updater functions',
);
assertEqual(processUpdateQueue(10, []), 10, 'empty queue returns the base state');
assertEqual(
  processUpdateQueue(5, [(p) => p + 1, 100, (p) => p - 1]),
  99,
  'a plain value replaces the accumulated state',
);`,
  },

  {
    id: 'use-state-hook',
    title: 'Build a tiny useState hook system',
    difficulty: 'Hard',
    tags: ['hooks', 'fiber', 'closures'],
    prompt:
      "React preserves hook state across renders by tracking the ORDER hooks are called in. Implement `createHooks()` returning `{ render, useState }`. `render(component)` resets the hook index and runs the component; `useState(initial)` returns `[value, setValue]`, persisting each slot's state across renders by call order. `setValue` updates the slot.",
    examples: [
      {
        input: 'render a counter twice, calling setCount(1) in between',
        output: 'second render sees count === 1',
      },
    ],
    hints: [
      'Keep an array of state slots and a cursor that resets to 0 in `render`.',
      'Each `useState` call reads/creates the slot at the current cursor, then advances it.',
      'The setter closes over its slot index so it writes to the right slot.',
    ],
    starterCode: `function createHooks() {
  // return { render, useState }
}`,
    solution: `function createHooks() {
  const slots = [];
  let cursor = 0;
  function useState(initial) {
    const i = cursor;
    if (slots.length <= i) slots[i] = initial;
    const setValue = (next) => {
      slots[i] = typeof next === 'function' ? next(slots[i]) : next;
    };
    cursor++;
    return [slots[i], setValue];
  }
  function render(component) {
    cursor = 0;
    return component();
  }
  return { render, useState };
}`,
    tests: `const { render, useState } = createHooks();
let captured;
function Counter() {
  const [count, setCount] = useState(0);
  captured = { count, setCount };
  return count;
}
assertEqual(render(Counter), 0, 'first render uses the initial value');
captured.setCount(1);
assertEqual(render(Counter), 1, 'state persists across renders by call order');
captured.setCount((c) => c + 10);
assertEqual(render(Counter), 11, 'functional updates read the latest slot value');`,
  },

  {
    id: 'use-memo-cache',
    title: 'Implement useMemo caching',
    difficulty: 'Medium',
    tags: ['hooks', 'useMemo', 'memoization'],
    prompt:
      "`useMemo(factory, deps)` recomputes only when `deps` change. Implement `createMemo()` returning a `memo(factory, deps)` function: on the first call it runs `factory` and caches the result; on later calls it re-runs `factory` only if `deps` changed (same semantics as a dep array — length or any `===` element differs).",
    examples: [
      {
        input: 'memo(fn, [1]) then memo(fn, [1]) then memo(fn, [2])',
        output: 'fn runs on calls 1 and 3 only',
      },
    ],
    hints: [
      'Cache the previous deps and the previous result.',
      'On each call, decide whether deps changed before deciding to recompute.',
      'On a miss, run the factory, store its result and the new deps, then return it.',
    ],
    starterCode: `function createMemo() {
  // return a memo(factory, deps) function
}`,
    solution: `function createMemo() {
  let lastDeps = null;
  let lastResult;
  let initialized = false;
  function changed(prev, next) {
    if (!initialized) return true;
    if (prev.length !== next.length) return true;
    for (let i = 0; i < next.length; i++) {
      if (prev[i] !== next[i]) return true;
    }
    return false;
  }
  return function memo(factory, deps) {
    if (changed(lastDeps, deps)) {
      lastResult = factory();
      lastDeps = deps;
      initialized = true;
    }
    return lastResult;
  };
}`,
    tests: `let runs = 0;
const memo = createMemo();
const factory = () => { runs++; return runs * 10; };
assertEqual(memo(factory, [1]), 10, 'first call computes');
assertEqual(memo(factory, [1]), 10, 'equal deps reuse the cache');
assertEqual(runs, 1, 'factory ran exactly once for equal deps');
assertEqual(memo(factory, [2]), 20, 'changed deps recompute');
assertEqual(runs, 2, 'factory ran again only on the change');`,
  },

  {
    id: 'pick-next-task',
    title: 'Pick the next task to run (scheduler)',
    difficulty: 'Medium',
    tags: ['scheduler', 'concurrent', 'priority'],
    prompt:
      "React's concurrent scheduler picks the highest-priority work next. Implement `pickNextTask(tasks)` where each task is `{ id, priority }` and a LOWER number means HIGHER priority. Return the `id` to run next; break ties by insertion order (FIFO). Return `null` for an empty list.",
    examples: [
      {
        input: "pickNextTask([{id:'a',priority:2},{id:'b',priority:1},{id:'c',priority:1}])",
        output: "'b'",
        explanation: 'b and c tie on priority 1; b came first',
      },
    ],
    hints: [
      'Scan once, tracking the best task seen so far.',
      'A task wins only if its priority is strictly LOWER than the current best.',
      'Because you use strict `<`, an equal-priority later task never displaces an earlier one (FIFO).',
    ],
    starterCode: `function pickNextTask(tasks) {
  // return the id of the next task to run, or null
}`,
    solution: `function pickNextTask(tasks) {
  let best = null;
  for (const task of tasks) {
    if (best === null || task.priority < best.priority) {
      best = task;
    }
  }
  return best ? best.id : null;
}`,
    tests: `assertEqual(
  pickNextTask([{ id: 'a', priority: 2 }, { id: 'b', priority: 1 }, { id: 'c', priority: 1 }]),
  'b',
  'lowest priority number wins, FIFO on ties',
);
assertEqual(
  pickNextTask([{ id: 'x', priority: 5 }, { id: 'y', priority: 3 }]),
  'y',
  'picks the more urgent task',
);
assertEqual(pickNextTask([]), null, 'empty queue returns null');`,
  },

  {
    id: 'time-slicing-budget',
    title: 'Cooperative time-slicing',
    difficulty: 'Hard',
    tags: ['scheduler', 'concurrent', 'time-slicing'],
    prompt:
      "React yields to the browser when its frame budget runs out. Implement two functions. `shouldYield(startTime, now, budgetMs)` returns `true` when `now - startTime >= budgetMs`. `runUnitsWithBudget(units, budgetMs, clock)` runs units one at a time, reading the current time from `clock` (an array of timestamps consumed in order: index 0 is the start, then one reading after each unit); stop BEFORE running a unit once the budget is exceeded. Return the number of units that ran.",
    examples: [
      {
        input: "runUnitsWithBudget(['a','b','c','d'], 5, [0, 2, 4, 6, 8])",
        output: '3',
        explanation: 'After 3 units the clock reads 6; 6 - 0 >= 5, so stop',
      },
    ],
    hints: [
      '`shouldYield` is just an elapsed-time comparison: `now - startTime >= budgetMs`.',
      'Read `clock[0]` as the start time, then after running each unit read the next clock value.',
      'Check `shouldYield` AFTER incrementing the count; stop the loop when it returns true.',
    ],
    starterCode: `function shouldYield(startTime, now, budgetMs) {
  // return true when the budget is used up
}

function runUnitsWithBudget(units, budgetMs, clock) {
  // return how many units ran before yielding
}`,
    solution: `function shouldYield(startTime, now, budgetMs) {
  return now - startTime >= budgetMs;
}

function runUnitsWithBudget(units, budgetMs, clock) {
  const start = clock[0];
  let ran = 0;
  for (let i = 0; i < units.length; i++) {
    ran++;
    const now = clock[ran];
    if (shouldYield(start, now, budgetMs)) break;
  }
  return ran;
}`,
    tests: `assert(shouldYield(0, 5, 5) === true, 'yields when elapsed equals the budget');
assert(shouldYield(0, 4, 5) === false, 'keeps going under budget');
assertEqual(
  runUnitsWithBudget(['a', 'b', 'c', 'd'], 5, [0, 2, 4, 6, 8]),
  3,
  'runs until the budget is exceeded',
);
assertEqual(
  runUnitsWithBudget(['a', 'b'], 100, [0, 10, 20]),
  2,
  'runs everything when the budget is generous',
);`,
  },

  {
    id: 'lane-bitmask',
    title: 'Combine priority lanes (bitmask)',
    difficulty: 'Medium',
    tags: ['lanes', 'bitmask', 'concurrent'],
    prompt:
      "React tracks pending work as a bitmask of priority 'lanes' (each lane is a power-of-two bit). Implement `mergeLanes(a, b)` (the union of two lane sets) and `includesLane(set, lane)` (whether `set` contains every bit in `lane`). Use bitwise operators only.",
    examples: [
      { input: 'mergeLanes(0b001, 0b100)', output: '5  (0b101)' },
      { input: 'includesLane(0b101, 0b100)', output: 'true' },
      { input: 'includesLane(0b101, 0b010)', output: 'false' },
    ],
    hints: [
      'A union of bit sets is the bitwise OR (`|`).',
      '`set` includes `lane` when ANDing them yields `lane` back: `(set & lane) === lane`.',
      'These are plain integer operations — no loops needed.',
    ],
    starterCode: `function mergeLanes(a, b) {
  // return the union of the two lane sets
}

function includesLane(set, lane) {
  // return true if set contains lane
}`,
    solution: `function mergeLanes(a, b) {
  return a | b;
}

function includesLane(set, lane) {
  return (set & lane) === lane;
}`,
    tests: `assertEqual(mergeLanes(1, 4), 5, 'union of lane 1 and lane 4');
assertEqual(mergeLanes(3, 1), 3, 'merging a subset changes nothing');
assert(includesLane(5, 4) === true, 'set contains the lane');
assert(includesLane(5, 2) === false, 'set is missing the lane');
assert(includesLane(7, 5) === true, 'set contains a multi-bit lane');`,
  },

  {
    id: 'bailout-render',
    title: 'Decide whether to bail out of a render',
    difficulty: 'Medium',
    tags: ['reconciliation', 'bailout', 'memoization'],
    prompt:
      "Before re-rendering, React bails out (reuses the previous output) when neither props nor state changed. Implement `bailout(prevProps, nextProps, prevState, nextState)` returning `true` when BOTH props and state are shallow-equal (same keys, `===` values). If either changed, return `false`.",
    examples: [
      {
        input: "bailout({a:1}, {a:1}, {n:0}, {n:0})",
        output: 'true',
      },
      {
        input: "bailout({a:1}, {a:2}, {n:0}, {n:0})",
        output: 'false',
        explanation: 'props changed → must re-render',
      },
    ],
    hints: [
      'Reuse a shallow-equality check on both the props pair and the state pair.',
      'Shallow-equal means same key count and every value equal by `===`.',
      'Bail out only when BOTH comparisons are equal.',
    ],
    starterCode: `function bailout(prevProps, nextProps, prevState, nextState) {
  // return true to skip the re-render
}`,
    solution: `function shallowEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

function bailout(prevProps, nextProps, prevState, nextState) {
  return shallowEqual(prevProps, nextProps) && shallowEqual(prevState, nextState);
}`,
    tests: `assert(bailout({ a: 1 }, { a: 1 }, { n: 0 }, { n: 0 }) === true, 'no change → bail out');
assert(bailout({ a: 1 }, { a: 2 }, { n: 0 }, { n: 0 }) === false, 'changed props → re-render');
assert(bailout({ a: 1 }, { a: 1 }, { n: 0 }, { n: 1 }) === false, 'changed state → re-render');
assert(bailout({}, {}, {}, {}) === true, 'empty props and state bail out');`,
  },

  {
    id: 'batch-updates',
    title: 'Batch functional updaters into one flush',
    difficulty: 'Medium',
    tags: ['batching', 'state', 'concurrent'],
    prompt:
      "React batches multiple `setState` calls and applies them together. Implement `createBatch(initial)` returning `{ enqueue, flush }`. `enqueue(updater)` collects functional updaters `(prev) => next`; `flush()` applies them in order over the starting state, clears the queue, and returns the final value. Calling `flush` again with no new updaters returns the already-committed state.",
    examples: [
      {
        input: "b = createBatch(0); b.enqueue(p=>p+1); b.enqueue(p=>p*10); b.flush()",
        output: '10',
        explanation: '0 → 1 → 10 in one flush',
      },
    ],
    hints: [
      'Keep the committed state and a queue of pending updaters.',
      'In `flush`, fold the queue over the current state, then empty the queue.',
      'Persist the committed state so a second `flush` with no updaters returns it unchanged.',
    ],
    starterCode: `function createBatch(initial) {
  // return { enqueue, flush }
}`,
    solution: `function createBatch(initial) {
  let state = initial;
  let queue = [];
  function enqueue(updater) {
    queue.push(updater);
  }
  function flush() {
    for (const updater of queue) {
      state = updater(state);
    }
    queue = [];
    return state;
  }
  return { enqueue, flush };
}`,
    tests: `const b = createBatch(0);
b.enqueue((p) => p + 1);
b.enqueue((p) => p * 10);
assertEqual(b.flush(), 10, 'applies all updaters in order');
assertEqual(b.flush(), 10, 'flushing again with no updates keeps the committed state');
b.enqueue((p) => p - 4);
assertEqual(b.flush(), 6, 'new updaters build on the committed state');`,
  },
];
