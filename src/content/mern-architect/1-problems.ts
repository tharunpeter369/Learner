import type { Problem } from '@/lib/problems';

// Top 10 implement-from-scratch interview problems for Module 1 (JavaScript
// Internals & Mastery). Each `tests` block runs in the browser sandbox after the
// user's code; it may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'implement-bind',
    title: 'Implement Function.prototype.bind',
    difficulty: 'Medium',
    tags: ['this', 'closures'],
    prompt:
      "Add `myBind` to `Function.prototype`. It returns a NEW function with `this` permanently bound to `context`, and supports partial application (preset leading arguments are merged with the arguments passed later).",
    examples: [
      {
        input: "greet.myBind({ name: 'Ada' }, 'Hi')('!')",
        output: "'Hi, Ada!'",
        explanation: "`this.name` is 'Ada'; 'Hi' is preset, '!' is passed at call time.",
      },
    ],
    hints: [
      'Capture the original function in a closure (`const fn = this`).',
      'Return a new function that calls the original with `apply`.',
      'Merge the preset args with the new args: `[...bound, ...rest]`.',
    ],
    starterCode: `Function.prototype.myBind = function (context, ...bound) {
  // your code here
};`,
    solution: `Function.prototype.myBind = function (context, ...bound) {
  const fn = this;
  return function (...rest) {
    return fn.apply(context, [...bound, ...rest]);
  };
};`,
    tests: `function greet(greeting, punc) { return greeting + ', ' + this.name + punc; }
const bound = greet.myBind({ name: 'Ada' }, 'Hi');
assertEqual(bound('!'), 'Hi, Ada!', 'binds this + partial args');
const add10 = (function (a, b) { return a + b; }).myBind(null, 10);
assertEqual(add10(5), 15, 'partial application works');`,
  },

  {
    id: 'implement-call-apply',
    title: 'Implement call and apply',
    difficulty: 'Easy',
    tags: ['this'],
    prompt:
      "Add `myCall` and `myApply` to `Function.prototype`. Both invoke the function immediately with a chosen `this`. `myCall` takes arguments one by one; `myApply` takes them as a single array.",
    examples: [
      { input: "whoAmI.myCall({ name: 'Rex' }, '!')", output: "'Rex!'" },
      { input: "whoAmI.myApply({ name: 'Sam' }, ['?'])", output: "'Sam?'" },
    ],
    hints: [
      'Temporarily attach the function as a property of `context`, then call it through the dot — implicit binding sets `this` for you.',
      "Use a `Symbol` as the temporary key so you never overwrite a real property.",
      'Clean up with `delete` and return the result.',
    ],
    starterCode: `Function.prototype.myCall = function (context, ...args) {
  // your code here
};

Function.prototype.myApply = function (context, args) {
  // your code here
};`,
    solution: `Function.prototype.myCall = function (context, ...args) {
  context = context || globalThis;
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};

Function.prototype.myApply = function (context, args = []) {
  context = context || globalThis;
  const key = Symbol('fn');
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};`,
    tests: `function whoAmI(p) { return this.name + p; }
assertEqual(whoAmI.myCall({ name: 'Rex' }, '!'), 'Rex!', 'myCall passes args one by one');
assertEqual(whoAmI.myApply({ name: 'Sam' }, ['?']), 'Sam?', 'myApply passes args as an array');`,
  },

  {
    id: 'implement-new',
    title: 'Implement the new operator',
    difficulty: 'Medium',
    tags: ['prototypes', 'this'],
    prompt:
      "Implement `myNew(Constructor, ...args)` that mimics `new`: create a fresh object, link its prototype to `Constructor.prototype`, run the constructor with `this` bound to it, and return the object — unless the constructor returns its own object, in which case that wins.",
    examples: [
      {
        input: 'myNew(Person, "Ada")',
        output: 'Person { name: "Ada" }',
        explanation: "Fields set, prototype methods available, `instanceof Person` is true.",
      },
    ],
    hints: [
      'Use `Object.create(Constructor.prototype)` for steps 1 and 2.',
      'Run the constructor with `Constructor.apply(obj, args)`.',
      'If the constructor returned a non-null object, return that instead of `obj`.',
    ],
    starterCode: `function myNew(Constructor, ...args) {
  // your code here
}`,
    solution: `function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return (result !== null && typeof result === 'object') ? result : obj;
}`,
    tests: `function Person(name) { this.name = name; }
Person.prototype.hi = function () { return 'hi ' + this.name; };
const p = myNew(Person, 'Ada');
assertEqual(p.name, 'Ada', 'sets instance fields');
assertEqual(p.hi(), 'hi Ada', 'links the prototype');
assert(p instanceof Person, 'instanceof works');
function Weird() { this.ignored = 1; return { real: true }; }
assertEqual(myNew(Weird), { real: true }, 'a returned object overrides');`,
  },

  {
    id: 'implement-debounce',
    title: 'Implement debounce',
    difficulty: 'Medium',
    tags: ['closures', 'timers', 'performance'],
    prompt:
      "Implement `debounce(fn, delay)`. The returned function postpones calling `fn` until `delay` ms have passed since the LAST call — so a burst of rapid calls results in a single execution with the most recent arguments.",
    examples: [
      {
        input: 'a debounced fn called 3x within the delay window',
        output: 'fn runs once',
        explanation: 'Each call resets the timer; only the final call survives.',
      },
    ],
    hints: [
      'Keep a timer id in a closure.',
      'On every call, `clearTimeout` the previous timer and start a new one.',
      'Use `fn.apply(this, args)` so the original `this`/args are preserved.',
    ],
    starterCode: `function debounce(fn, delay) {
  // your code here
}`,
    solution: `function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}`,
    tests: `let calls = 0;
const fn = debounce(() => { calls++; }, 30);
fn(); fn(); fn();
assertEqual(calls, 0, 'does not run synchronously');
await new Promise((r) => setTimeout(r, 60));
assertEqual(calls, 1, 'collapses a burst into a single call');`,
  },

  {
    id: 'implement-throttle',
    title: 'Implement throttle',
    difficulty: 'Medium',
    tags: ['closures', 'timers', 'performance'],
    prompt:
      "Implement `throttle(fn, limit)`. The returned function runs `fn` immediately, then ignores further calls until `limit` ms have elapsed (leading-edge throttle).",
    examples: [
      {
        input: 'a throttled fn called 3x instantly',
        output: 'fn runs once immediately',
        explanation: 'After the window passes, the next call runs again.',
      },
    ],
    hints: [
      'Track a boolean `waiting` flag in a closure.',
      'If waiting, return early; otherwise run `fn` and set `waiting = true`.',
      'Reset `waiting` to false with a `setTimeout` of `limit` ms.',
    ],
    starterCode: `function throttle(fn, limit) {
  // your code here
}`,
    solution: `function throttle(fn, limit) {
  let waiting = false;
  return function (...args) {
    if (waiting) return;
    fn.apply(this, args);
    waiting = true;
    setTimeout(() => { waiting = false; }, limit);
  };
}`,
    tests: `let calls = 0;
const fn = throttle(() => { calls++; }, 50);
fn(); fn(); fn();
assertEqual(calls, 1, 'runs immediately, then blocks');
await new Promise((r) => setTimeout(r, 70));
fn();
assertEqual(calls, 2, 'runs again after the window');`,
  },

  {
    id: 'implement-promise-all',
    title: 'Implement Promise.all',
    difficulty: 'Medium',
    tags: ['promises', 'async'],
    prompt:
      "Implement `promiseAll(promises)` that returns a promise resolving to an array of results IN INPUT ORDER once all settle, or rejecting as soon as any input rejects (fail-fast). Non-promise values should pass through.",
    examples: [
      { input: 'promiseAll([1, Promise.resolve(2), 3])', output: '[1, 2, 3]' },
      { input: 'promiseAll([Promise.resolve(1), Promise.reject("boom")])', output: "rejects with 'boom'" },
    ],
    hints: [
      'Return a new Promise; track a `remaining` counter.',
      'Write each result to `results[i]` so input order is preserved (not finish order).',
      'Wrap items in `Promise.resolve(p)` so plain values work; pass `reject` straight through.',
    ],
    starterCode: `function promiseAll(promises) {
  // your code here
}`,
    solution: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let remaining = promises.length;
    if (remaining === 0) return resolve(results);
    promises.forEach((p, i) => {
      Promise.resolve(p).then((value) => {
        results[i] = value;
        if (--remaining === 0) resolve(results);
      }, reject);
    });
  });
}`,
    tests: `const r = await promiseAll([1, Promise.resolve(2), 3]);
assertEqual(r, [1, 2, 3], 'resolves in input order');
let err;
try { await promiseAll([Promise.resolve(1), Promise.reject('boom')]); }
catch (e) { err = e; }
assertEqual(err, 'boom', 'rejects on the first rejection');`,
  },

  {
    id: 'implement-event-emitter',
    title: 'Implement an Event Emitter',
    difficulty: 'Medium',
    tags: ['patterns', 'pub-sub'],
    prompt:
      "Implement an `EventEmitter` class with `on(event, cb)`, `off(event, cb)`, `emit(event, ...args)`, and `once(event, cb)` (fires at most once). `emit` should call every subscribed listener with the emitted arguments.",
    examples: [
      {
        input: "bus.on('add', n => sum += n); bus.emit('add', 5)",
        output: 'the listener runs with 5',
      },
    ],
    hints: [
      'Store listeners as a map of event name → array of callbacks.',
      '`off` filters the callback out of that event’s array.',
      "`once` wraps the callback so it removes itself after the first `emit`.",
    ],
    starterCode: `class EventEmitter {
  // your code here
}`,
    solution: `class EventEmitter {
  constructor() { this.listeners = {}; }
  on(event, cb) { (this.listeners[event] ||= []).push(cb); return () => this.off(event, cb); }
  off(event, cb) { this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== cb); }
  emit(event, ...args) { (this.listeners[event] || []).forEach((cb) => cb(...args)); }
  once(event, cb) {
    const wrapper = (...a) => { cb(...a); this.off(event, wrapper); };
    this.on(event, wrapper);
  }
}`,
    tests: `const bus = new EventEmitter();
let sum = 0;
const off = bus.on('add', (n) => { sum += n; });
bus.emit('add', 5); bus.emit('add', 3);
assertEqual(sum, 8, 'on + emit deliver args to listeners');
off();
bus.emit('add', 100);
assertEqual(sum, 8, 'off unsubscribes');
let pings = 0;
bus.once('ping', () => { pings++; });
bus.emit('ping'); bus.emit('ping');
assertEqual(pings, 1, 'once fires only once');`,
  },

  {
    id: 'implement-deep-clone',
    title: 'Implement deep clone',
    difficulty: 'Medium',
    tags: ['recursion', 'objects'],
    prompt:
      "Implement `deepClone(value)` that recursively clones plain objects and arrays, so mutating the clone never affects the original. Primitives are returned as-is. (You may ignore Maps, Sets, Dates, and circular references.)",
    examples: [
      {
        input: 'deepClone({ a: 1, b: { c: [1, 2] } })',
        output: 'a structurally-equal but independent object',
      },
    ],
    hints: [
      'Base case: if `value` is null or not an object, return it directly.',
      'Arrays: map each element through `deepClone`.',
      'Objects: rebuild a new object, recursing on each value.',
    ],
    starterCode: `function deepClone(value) {
  // your code here
}`,
    solution: `function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  const out = {};
  for (const key of Object.keys(value)) out[key] = deepClone(value[key]);
  return out;
}`,
    tests: `const original = { a: 1, b: { c: [1, 2, { d: 3 }] } };
const copy = deepClone(original);
assertEqual(copy, original, 'clone is structurally equal');
copy.b.c[2].d = 99;
assertEqual(original.b.c[2].d, 3, 'mutating the clone does not touch the original');`,
  },

  {
    id: 'implement-curry',
    title: 'Implement curry',
    difficulty: 'Medium',
    tags: ['functional', 'closures'],
    prompt:
      "Implement `curry(fn)` so a function expecting N arguments can be called with the arguments one at a time, or in groups, until all N are supplied — at which point `fn` runs. Use `fn.length` to know the arity.",
    examples: [
      { input: 'curry(add3)(1)(2)(3)', output: '6' },
      { input: 'curry(add3)(1, 2)(3)', output: '6' },
      { input: 'curry(add3)(1, 2, 3)', output: '6' },
    ],
    hints: [
      'Compare collected args length with `fn.length`.',
      'If enough args, call `fn.apply(this, args)`.',
      'Otherwise return a function that collects more and recurses.',
    ],
    starterCode: `function curry(fn) {
  // your code here
}`,
    solution: `function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...more) => curried.apply(this, [...args, ...more]);
  };
}`,
    tests: `const add = curry((a, b, c) => a + b + c);
assertEqual(add(1)(2)(3), 6, 'one argument at a time');
assertEqual(add(1, 2)(3), 6, 'grouped arguments');
assertEqual(add(1, 2, 3), 6, 'all at once');`,
  },

  {
    id: 'implement-memoize',
    title: 'Implement memoize',
    difficulty: 'Medium',
    tags: ['closures', 'performance'],
    prompt:
      "Implement `memoize(fn)` that caches results keyed by the arguments, so repeated calls with the same arguments return the cached result without re-running `fn`. (A JSON key of the args list is fine for this exercise.)",
    examples: [
      {
        input: 'a memoized adder called twice with (1, 2)',
        output: 'computes once, returns 3 both times',
      },
    ],
    hints: [
      'Keep a `Map` (or object) cache in a closure.',
      'Build a key from the arguments, e.g. `JSON.stringify(args)`.',
      'Return the cached value if present; otherwise compute, store, and return it.',
    ],
    starterCode: `function memoize(fn) {
  // your code here
}`,
    solution: `function memoize(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
    tests: `let runs = 0;
const slow = memoize((a, b) => { runs++; return a + b; });
assertEqual(slow(1, 2), 3, 'returns the correct result');
slow(1, 2); slow(1, 2);
assertEqual(runs, 1, 'computes once for repeated args');
assertEqual(slow(2, 2), 4, 'new args compute again');
assertEqual(runs, 2, 'ran twice total');`,
  },
];
