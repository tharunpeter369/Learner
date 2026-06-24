import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 4 (Performance & Core Web Vitals).
// The grader runs in a Web Worker (no DOM), so these target the JS LOGIC behind
// web performance — debounce/throttle/once, percentile/CWV math, responsive
// image selection, list virtualization, retry backoff, concurrency limiting,
// and memoization — all runtime-gradable, pure JavaScript.
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'debounce',
    title: 'Implement trailing debounce',
    difficulty: 'Medium',
    tags: ['debounce', 'event-loop', 'rate-limiting'],
    prompt:
      "Debouncing collapses a burst of rapid calls (scroll, resize, keypress) into a single call after activity stops — key for avoiding expensive work on every event. Implement `debounce(fn, delay)` returning a wrapped function that invokes `fn` only `delay` ms after the LAST call. Each new call resets the timer.",
    examples: [
      {
        input: 'd = debounce(fn, 20); d(); d(); d(); (await > 20ms)',
        output: 'fn called exactly once',
      },
    ],
    hints: [
      'Keep a timer id in a closure variable.',
      'On each call, `clearTimeout` the previous timer before scheduling a new one.',
      'Forward the latest arguments to `fn` when the timer finally fires.',
    ],
    starterCode: `function debounce(fn, delay) {
  // return a debounced wrapper of fn
}`,
    solution: `function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  };
}`,
    tests: `let calls = 0;
let lastArg = null;
const d = debounce((x) => { calls++; lastArg = x; }, 20);
d(1); d(2); d(3);
assertEqual(calls, 0, 'does not fire synchronously');
await new Promise((r) => setTimeout(r, 40));
assertEqual(calls, 1, 'fires exactly once after the burst');
assertEqual(lastArg, 3, 'uses the arguments from the last call');`,
  },

  {
    id: 'throttle',
    title: 'Implement leading throttle',
    difficulty: 'Medium',
    tags: ['throttle', 'event-loop', 'rate-limiting'],
    prompt:
      "Throttling caps how often a function can run during a continuous stream of events. Implement `throttle(fn, interval)` with LEADING behavior: the first call runs `fn` immediately, then any calls within `interval` ms are ignored; after the window passes, the next call fires again.",
    examples: [
      {
        input: 't = throttle(fn, 20); t(); t(); t()',
        output: 'fn called once immediately (the extra calls are ignored)',
      },
    ],
    hints: [
      'Track the timestamp of the last accepted call (start at 0 so the first call always runs).',
      'Use `Date.now()` (or `performance.now()`); run `fn` only when `now - last >= interval`.',
      'Update the last-run timestamp each time you actually invoke `fn`.',
    ],
    starterCode: `function throttle(fn, interval) {
  // return a throttled wrapper of fn (leading edge)
}`,
    solution: `function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      return fn.apply(this, args);
    }
  };
}`,
    tests: `let calls = 0;
const t = throttle(() => { calls++; }, 30);
t(); t(); t();
assertEqual(calls, 1, 'fires immediately, ignores the burst');
await new Promise((r) => setTimeout(r, 50));
t();
assertEqual(calls, 2, 'fires again after the interval elapses');`,
  },

  {
    id: 'once',
    title: 'Run a function at most once',
    difficulty: 'Easy',
    tags: ['memoization', 'initialization'],
    prompt:
      "Expensive one-time setup (loading a polyfill, initializing a singleton) should run only on the first call. Implement `once(fn)` returning a wrapper that calls `fn` the first time and, on every later call, returns the cached first result WITHOUT calling `fn` again.",
    examples: [
      {
        input: 'g = once(() => Math.random()); g() === g()',
        output: 'true — same cached value, fn ran once',
      },
    ],
    hints: [
      'Keep a boolean `called` flag and a `result` slot in the closure.',
      'On the first call, run `fn`, store the result, and set the flag.',
      'On later calls, skip `fn` and return the stored result.',
    ],
    starterCode: `function once(fn) {
  // return a wrapper that runs fn at most once
}`,
    solution: `function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}`,
    tests: `let runs = 0;
const init = once((x) => { runs++; return x * 2; });
assertEqual(init(5), 10, 'returns the first result');
assertEqual(init(99), 10, 'later calls return the cached result');
assertEqual(runs, 1, 'fn runs exactly once');`,
  },

  {
    id: 'percentile',
    title: 'Compute a metric percentile (p75)',
    difficulty: 'Medium',
    tags: ['core-web-vitals', 'statistics', 'metrics'],
    prompt:
      "Core Web Vitals are reported at the 75th percentile (p75) of real-user samples. Implement `percentile(samples, p)` using the NEAREST-RANK method: sort ascending, then return the value at rank `ceil(p/100 * n)` (1-based). For example with `n = 8` and `p = 75`, rank = `ceil(6) = 6`, so return the 6th-smallest value. Return `null` for an empty array.",
    examples: [
      {
        input: 'percentile([10, 20, 30, 40, 50, 60, 70, 80], 75)',
        output: '60',
        explanation: 'rank = ceil(0.75 * 8) = 6 → the 6th-smallest value',
      },
    ],
    hints: [
      'Copy before sorting and sort numerically: `[...samples].sort((a, b) => a - b)`.',
      'Rank is `Math.ceil((p / 100) * n)`; convert to a 0-based index with `rank - 1`.',
      'Guard the empty array (return `null`) and clamp the index into range.',
    ],
    starterCode: `function percentile(samples, p) {
  // nearest-rank percentile; return null if empty
}`,
    solution: `function percentile(samples, p) {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const index = Math.min(Math.max(rank, 1), sorted.length) - 1;
  return sorted[index];
}`,
    tests: `assertEqual(percentile([10, 20, 30, 40, 50, 60, 70, 80], 75), 60, 'p75 nearest-rank');
assertEqual(percentile([3, 1, 2, 5, 4], 100), 5, 'p100 is the max');
assertEqual(percentile([42], 50), 42, 'single sample');
assertEqual(percentile([], 75), null, 'empty array → null');`,
  },

  {
    id: 'cls-score',
    title: 'Sum a Cumulative Layout Shift score',
    difficulty: 'Easy',
    tags: ['core-web-vitals', 'cls', 'metrics'],
    prompt:
      "Cumulative Layout Shift (CLS) measures visual instability by adding up individual layout-shift scores. Implement `clsScore(shifts)` that returns the sum of all shift score numbers, rounded to 4 decimal places to avoid floating-point noise. An empty list scores `0`.",
    examples: [
      {
        input: 'clsScore([0.05, 0.1, 0.0025])',
        output: '0.1525',
      },
    ],
    hints: [
      'Use `reduce` to add the numbers, starting from `0`.',
      'Round with `Math.round(sum * 1e4) / 1e4` to get 4 decimal places.',
      'An empty array reduces to the initial value, `0`.',
    ],
    starterCode: `function clsScore(shifts) {
  // sum the layout-shift scores, rounded to 4 dp
}`,
    solution: `function clsScore(shifts) {
  const sum = shifts.reduce((total, s) => total + s, 0);
  return Math.round(sum * 1e4) / 1e4;
}`,
    tests: `assertEqual(clsScore([0.05, 0.1, 0.0025]), 0.1525, 'sums the shift scores');
assertEqual(clsScore([0.1, 0.2]), 0.3, 'avoids floating-point drift');
assertEqual(clsScore([]), 0, 'no shifts → 0');`,
  },

  {
    id: 'pick-image-src',
    title: 'Pick a responsive image source',
    difficulty: 'Medium',
    tags: ['images', 'srcset', 'lcp'],
    prompt:
      "Responsive images (`srcset`) avoid shipping oversized assets — critical for LCP. Implement `pickImageSrc(candidates, viewportWidth)` that returns the `src` of the SMALLEST candidate whose `width >= viewportWidth`; if none is wide enough, return the `src` of the LARGEST candidate. Each candidate is `{ src, width }`. Return `null` for an empty list.",
    examples: [
      {
        input: "pickImageSrc([{src:'s.jpg',width:320},{src:'m.jpg',width:640},{src:'l.jpg',width:1280}], 500)",
        output: "'m.jpg'",
        explanation: '640 is the smallest width >= 500',
      },
    ],
    hints: [
      'Sort the candidates by width ascending so you can scan from smallest to largest.',
      'Return the first candidate whose width is >= the viewport width.',
      'If none qualifies, fall back to the last (largest) candidate.',
    ],
    starterCode: `function pickImageSrc(candidates, viewportWidth) {
  // return the best src, or null if there are no candidates
}`,
    solution: `function pickImageSrc(candidates, viewportWidth) {
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => a.width - b.width);
  for (const c of sorted) {
    if (c.width >= viewportWidth) return c.src;
  }
  return sorted[sorted.length - 1].src;
}`,
    tests: `const set = [
  { src: 's.jpg', width: 320 },
  { src: 'm.jpg', width: 640 },
  { src: 'l.jpg', width: 1280 },
];
assertEqual(pickImageSrc(set, 500), 'm.jpg', 'smallest width >= viewport');
assertEqual(pickImageSrc(set, 320), 's.jpg', 'exact match qualifies');
assertEqual(pickImageSrc(set, 2000), 'l.jpg', 'falls back to the largest');
assertEqual(pickImageSrc([], 500), null, 'no candidates → null');`,
  },

  {
    id: 'visible-range',
    title: 'Compute the visible range for virtualization',
    difficulty: 'Medium',
    tags: ['virtualization', 'rendering', 'performance'],
    prompt:
      "List virtualization renders only the rows in (or near) the viewport. Implement `visibleRange(scrollTop, rowHeight, viewportH, total, overscan)` returning `{ start, end }` (a half-open range `[start, end)`). `start = floor(scrollTop / rowHeight) - overscan`, and `end = ceil((scrollTop + viewportH) / rowHeight) + overscan`. Clamp `start` to `>= 0` and `end` to `<= total`.",
    examples: [
      {
        input: 'visibleRange(100, 20, 100, 50, 2)',
        output: '{ start: 3, end: 12 }',
        explanation: 'floor(5)-2=3; ceil(200/20)=10, +2=12',
      },
    ],
    hints: [
      'First visible row index is `Math.floor(scrollTop / rowHeight)`.',
      'Last (exclusive) is `Math.ceil((scrollTop + viewportH) / rowHeight)`.',
      'Apply overscan on both sides, then clamp: `Math.max(0, start)` and `Math.min(total, end)`.',
    ],
    starterCode: `function visibleRange(scrollTop, rowHeight, viewportH, total, overscan) {
  // return { start, end } clamped to [0, total]
}`,
    solution: `function visibleRange(scrollTop, rowHeight, viewportH, total, overscan) {
  const first = Math.floor(scrollTop / rowHeight) - overscan;
  const last = Math.ceil((scrollTop + viewportH) / rowHeight) + overscan;
  const start = Math.max(0, first);
  const end = Math.min(total, last);
  return { start, end };
}`,
    tests: `assertEqual(visibleRange(100, 20, 100, 50, 2), { start: 3, end: 12 }, 'overscan applied');
assertEqual(visibleRange(0, 20, 100, 50, 0), { start: 0, end: 5 }, 'top of list, no overscan');
assertEqual(visibleRange(900, 20, 100, 50, 5), { start: 40, end: 50 }, 'clamps end to total');`,
  },

  {
    id: 'backoff-delays',
    title: 'Build exponential backoff delays',
    difficulty: 'Medium',
    tags: ['retry', 'backoff', 'networking'],
    prompt:
      "Retrying failed requests with exponential backoff avoids hammering a struggling server. Implement `backoffDelays(attempts, baseMs, capMs)` returning an array of `attempts` delays where delay `i` (0-based) is `baseMs * 2^i`, each capped at `capMs`. No randomness/jitter.",
    examples: [
      {
        input: 'backoffDelays(5, 100, 1000)',
        output: '[100, 200, 400, 800, 1000]',
        explanation: 'the 5th would be 1600 but is capped at 1000',
      },
    ],
    hints: [
      'Build an array of length `attempts` (e.g. `Array.from({ length: attempts })`).',
      'For index `i`, the raw delay is `baseMs * 2 ** i`.',
      'Clamp each with `Math.min(raw, capMs)`.',
    ],
    starterCode: `function backoffDelays(attempts, baseMs, capMs) {
  // return an array of capped exponential delays
}`,
    solution: `function backoffDelays(attempts, baseMs, capMs) {
  return Array.from({ length: attempts }, (_, i) =>
    Math.min(baseMs * 2 ** i, capMs),
  );
}`,
    tests: `assertEqual(backoffDelays(5, 100, 1000), [100, 200, 400, 800, 1000], 'caps later delays');
assertEqual(backoffDelays(3, 50, 10000), [50, 100, 200], 'no capping when under the cap');
assertEqual(backoffDelays(0, 100, 1000), [], 'zero attempts → empty array');`,
  },

  {
    id: 'limit-concurrency',
    title: 'Limit async concurrency',
    difficulty: 'Hard',
    tags: ['async', 'concurrency', 'networking'],
    prompt:
      "Firing every network request at once can saturate the connection and stall the page. Implement `limitConcurrency(tasks, n)` where `tasks` is an array of functions each returning a promise. Run at most `n` tasks in flight at a time, and resolve to an array of their results IN THE ORIGINAL ORDER (not completion order).",
    examples: [
      {
        input: 'limitConcurrency([() => Promise.resolve(1), () => Promise.resolve(2)], 1)',
        output: '[1, 2]',
      },
    ],
    hints: [
      'Pre-size a `results` array; write each result at its original index so order is preserved.',
      'Keep a shared cursor; spawn `n` workers that each pull the next index until tasks run out.',
      'Await `Promise.all` of the worker promises, then return `results`.',
    ],
    starterCode: `async function limitConcurrency(tasks, n) {
  // run at most n tasks at once; resolve results in order
}`,
    solution: `async function limitConcurrency(tasks, n) {
  const results = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }
  const workers = [];
  for (let i = 0; i < Math.min(n, tasks.length); i++) {
    workers.push(worker());
  }
  await Promise.all(workers);
  return results;
}`,
    tests: `const delay = (ms, v) => new Promise((r) => setTimeout(() => r(v), ms));
const tasks = [
  () => delay(30, 'a'),
  () => delay(10, 'b'),
  () => delay(20, 'c'),
  () => delay(5, 'd'),
];
const out = await limitConcurrency(tasks, 2);
assertEqual(out, ['a', 'b', 'c', 'd'], 'results stay in original order');

let inFlight = 0;
let peak = 0;
const tracked = Array.from({ length: 6 }, (_, i) => async () => {
  inFlight++;
  peak = Math.max(peak, inFlight);
  await delay(10, i);
  inFlight--;
  return i;
});
const ordered = await limitConcurrency(tracked, 2);
assertEqual(ordered, [0, 1, 2, 3, 4, 5], 'all tasks resolve in order');
assert(peak <= 2, 'never exceeds the concurrency limit');`,
  },

  {
    id: 'memoize-with',
    title: 'Memoize with a custom key',
    difficulty: 'Hard',
    tags: ['memoization', 'caching', 'performance'],
    prompt:
      "Caching pure-function results avoids redundant expensive work. Implement `memoizeWith(fn, keyFn)` returning a memoized version of `fn`: it computes a cache key with `keyFn(...args)` and runs `fn` only once per distinct key, returning the cached result for repeated keys.",
    examples: [
      {
        input: "m = memoizeWith(fn, (a, b) => a + ':' + b); m(1, 2); m(1, 2)",
        output: 'fn runs once; the second call returns the cached result',
      },
    ],
    hints: [
      'Use a `Map` from key → result so any serializable key works.',
      'On each call, derive the key with `keyFn(...args)` and check `map.has(key)`.',
      'Only call `fn` (and store) on a cache miss; otherwise return the stored value.',
    ],
    starterCode: `function memoizeWith(fn, keyFn) {
  // return a memoized wrapper keyed by keyFn(...args)
}`,
    solution: `function memoizeWith(fn, keyFn) {
  const cache = new Map();
  return function (...args) {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
    tests: `let runs = 0;
const slowAdd = memoizeWith(
  (a, b) => { runs++; return a + b; },
  (a, b) => a + ':' + b,
);
assertEqual(slowAdd(1, 2), 3, 'computes on a cache miss');
assertEqual(slowAdd(1, 2), 3, 'returns the cached result');
assertEqual(runs, 1, 'fn runs once per distinct key');
assertEqual(slowAdd(2, 3), 5, 'different key recomputes');
assertEqual(runs, 2, 'fn ran again for the new key');`,
  },
];
