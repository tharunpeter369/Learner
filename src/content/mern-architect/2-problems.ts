import type { Problem } from '@/lib/problems';

// Top 10 interview problems for Module 2 (TypeScript Mastery). These are
// RUNTIME-gradable: the sandbox transpiles the TS and runs it, so each problem
// has real runtime behaviour the test harness can assert (purely type-level
// puzzles like `Pick<T, K>` can't be graded at runtime, so we phrase the
// utilities as runtime functions with TypeScript-typed signatures).
// `tests` may use `assert(cond, msg)` and `assertEqual(actual, expected, msg)`.

export const problems: Problem[] = [
  {
    id: 'discriminated-union-area',
    title: 'Narrow a discriminated union',
    difficulty: 'Easy',
    language: 'typescript',
    tags: ['narrowing', 'unions'],
    prompt:
      "Given a `Shape` discriminated union (tagged by `kind`), implement `area(shape)`. Switch on `shape.kind` — TypeScript narrows each branch so the right fields are available.",
    examples: [
      { input: "area({ kind: 'square', side: 3 })", output: '9' },
      { input: "area({ kind: 'rect', w: 2, h: 5 })", output: '10' },
    ],
    hints: [
      'Switch on the discriminant property `shape.kind`.',
      'Inside each `case`, TypeScript knows the exact shape — use its fields.',
      "Circle area is `Math.PI * r * r`.",
    ],
    starterCode: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }
  | { kind: 'rect'; w: number; h: number };

function area(shape: Shape): number {
  // your code here
}`,
    solution: `type Shape =
  | { kind: 'circle'; r: number }
  | { kind: 'square'; side: number }
  | { kind: 'rect'; w: number; h: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.r * shape.r;
    case 'square': return shape.side * shape.side;
    case 'rect': return shape.w * shape.h;
  }
}`,
    tests: `assertEqual(area({ kind: 'square', side: 3 }), 9, 'square');
assertEqual(area({ kind: 'rect', w: 2, h: 5 }), 10, 'rectangle');
assert(Math.abs(area({ kind: 'circle', r: 1 }) - Math.PI) < 1e-9, 'circle ≈ π');`,
  },

  {
    id: 'user-defined-type-guard',
    title: 'Write a user-defined type guard',
    difficulty: 'Easy',
    language: 'typescript',
    tags: ['type guards', 'narrowing'],
    prompt:
      "Implement `isStringArray(value)` whose return type is the type predicate `value is string[]`. It must return `true` only when `value` is an array whose every element is a string.",
    examples: [
      { input: "isStringArray(['a', 'b'])", output: 'true' },
      { input: "isStringArray(['a', 1])", output: 'false' },
    ],
    hints: [
      'Return type should be `value is string[]`.',
      'Use `Array.isArray` first to narrow to an array.',
      "Then check `value.every((v) => typeof v === 'string')`.",
    ],
    starterCode: `function isStringArray(value: unknown): value is string[] {
  // your code here
}`,
    solution: `function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}`,
    tests: `assertEqual(isStringArray(['a', 'b']), true, 'all strings');
assertEqual(isStringArray(['a', 1]), false, 'mixed types');
assertEqual(isStringArray('abc'), false, 'not an array');
assertEqual(isStringArray([]), true, 'empty array is a string[]');`,
  },

  {
    id: 'exhaustive-assert-never',
    title: 'Exhaustiveness with assertNever',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['never', 'exhaustiveness'],
    prompt:
      "Implement `label(status)` for the `Status` union. Handle every case in a `switch`, and call `assertNever(status)` in the `default` so an unhandled future variant becomes a compile error (and throws at runtime).",
    examples: [
      { input: "label('open')", output: "'Open'" },
      { input: "label('pending')", output: "'Pending'" },
    ],
    hints: [
      'Add a `case` for each member of the union.',
      'In `default`, `return assertNever(status)`.',
      'If `status` is still assignable to `never` there, every case is covered.',
    ],
    starterCode: `type Status = 'open' | 'closed' | 'pending';

function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}

function label(status: Status): string {
  // handle every case; call assertNever in the default
}`,
    solution: `type Status = 'open' | 'closed' | 'pending';

function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}

function label(status: Status): string {
  switch (status) {
    case 'open': return 'Open';
    case 'closed': return 'Closed';
    case 'pending': return 'Pending';
    default: return assertNever(status);
  }
}`,
    tests: `assertEqual(label('open'), 'Open', 'open');
assertEqual(label('pending'), 'Pending', 'pending');
let threw = false;
try { label('bogus'); } catch (e) { threw = true; }
assert(threw, 'assertNever throws on an unexpected value');`,
  },

  {
    id: 'runtime-pick',
    title: 'Implement pick (runtime Pick)',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['generics', 'keyof', 'utility types'],
    prompt:
      "Implement `pick(obj, keys)` — the runtime companion of the `Pick<T, K>` type. It returns a new object containing only the given keys, typed as `Pick<T, K>`. Use `K extends keyof T` so only real keys are allowed.",
    examples: [
      { input: "pick({ id: 1, name: 'Ada', email: 'a@b.com' }, ['id', 'name'])", output: "{ id: 1, name: 'Ada' }" },
    ],
    hints: [
      'Constrain the keys: `K extends keyof T`.',
      'Start with an empty object typed `as Pick<T, K>`.',
      'Copy each requested key from `obj` if present.',
    ],
    starterCode: `function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  // your code here
}`,
    solution: `function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
}`,
    tests: `const user = { id: 1, name: 'Ada', email: 'a@b.com' };
assertEqual(pick(user, ['id', 'name']), { id: 1, name: 'Ada' }, 'keeps only picked keys');
assertEqual(pick(user, []), {}, 'empty keys gives an empty object');`,
  },

  {
    id: 'runtime-omit',
    title: 'Implement omit (runtime Omit)',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['generics', 'keyof', 'utility types'],
    prompt:
      "Implement `omit(obj, keys)` — the runtime companion of `Omit<T, K>`. Return a shallow copy of `obj` with the given keys removed, typed as `Omit<T, K>`.",
    examples: [
      { input: "omit({ id: 1, name: 'Ada', password: 'secret' }, ['password'])", output: "{ id: 1, name: 'Ada' }" },
    ],
    hints: [
      'Shallow-copy with the spread operator: `{ ...obj }`.',
      '`delete` each key in `keys` from the copy.',
      'Assert the result `as Omit<T, K>` at the end.',
    ],
    starterCode: `function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  // your code here
}`,
    solution: `function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const out = { ...obj };
  for (const key of keys) {
    delete out[key];
  }
  return out as Omit<T, K>;
}`,
    tests: `const user = { id: 1, name: 'Ada', password: 'secret' };
assertEqual(omit(user, ['password']), { id: 1, name: 'Ada' }, 'drops the omitted key');
assert(!('password' in omit(user, ['password'])), 'password is gone');`,
  },

  {
    id: 'result-type',
    title: 'Model a Result (success or error)',
    difficulty: 'Easy',
    language: 'typescript',
    tags: ['unions', 'error handling'],
    prompt:
      "Using the `Result<T>` discriminated union, implement `safeDivide(a, b)` that returns `{ ok: true, value }` normally, or `{ ok: false, error }` when dividing by zero — instead of throwing.",
    examples: [
      { input: 'safeDivide(10, 2)', output: '{ ok: true, value: 5 }' },
      { input: 'safeDivide(1, 0)', output: "{ ok: false, error: 'division by zero' }" },
    ],
    hints: [
      'Check `b === 0` first.',
      'Return the `{ ok: false, error }` branch on divide-by-zero.',
      'Otherwise return `{ ok: true, value: a / b }`.',
    ],
    starterCode: `type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function safeDivide(a: number, b: number): Result<number> {
  // your code here
}`,
    solution: `type Result<T> = { ok: true; value: T } | { ok: false; error: string };

function safeDivide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: 'division by zero' };
  return { ok: true, value: a / b };
}`,
    tests: `assertEqual(safeDivide(10, 2), { ok: true, value: 5 }, 'valid division');
const bad = safeDivide(1, 0);
assertEqual(bad.ok, false, 'divide by zero is not ok');
if (!bad.ok) assertEqual(bad.error, 'division by zero', 'carries an error message');`,
  },

  {
    id: 'branded-email',
    title: 'Create a branded type',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['branded types', 'validation'],
    prompt:
      "`Email` is a branded type (a `string` tagged with a unique brand) so a raw `string` can't be passed where an `Email` is required. Implement `createEmail(value)` — the only way to mint one — which validates the format and throws on anything invalid.",
    examples: [
      { input: "createEmail('ada@dev.io')", output: "'ada@dev.io'" },
      { input: "createEmail('nope')", output: 'throws' },
    ],
    hints: [
      'Validate the format (a simple regex with one `@` and a dot is fine).',
      'Throw an `Error` when the value is invalid.',
      'Return the validated string `as Email`.',
    ],
    starterCode: `type Email = string & { readonly __brand: 'Email' };

function createEmail(value: string): Email {
  // validate, then return value as Email (or throw)
}`,
    solution: `type Email = string & { readonly __brand: 'Email' };

function createEmail(value: string): Email {
  if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(value)) {
    throw new Error('Invalid email: ' + value);
  }
  return value as Email;
}`,
    tests: `assertEqual(createEmail('ada@dev.io'), 'ada@dev.io', 'returns a valid email');
let threw = false;
try { createEmail('not-an-email'); } catch (e) { threw = true; }
assert(threw, 'rejects an invalid email');`,
  },

  {
    id: 'deep-freeze',
    title: 'Implement deepFreeze',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['immutability', 'recursion'],
    prompt:
      "`Object.freeze` is shallow. Implement `deepFreeze(obj)` that recursively freezes an object and all nested objects, returning it typed as `Readonly<T>`. After freezing, nested mutations must not take effect.",
    examples: [
      {
        input: "deepFreeze({ db: { host: 'localhost' } })",
        output: 'object frozen at every level',
      },
    ],
    hints: [
      'Recurse into each value before freezing the object itself.',
      'Only recurse into values that are objects.',
      'Call `Object.freeze(obj)` after freezing its children.',
    ],
    starterCode: `function deepFreeze<T>(obj: T): Readonly<T> {
  // recursively freeze obj and its nested objects
}`,
    solution: `function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      deepFreeze((obj as Record<string, unknown>)[key]);
    }
    Object.freeze(obj);
  }
  return obj;
}`,
    tests: `const config = deepFreeze({ db: { host: 'localhost', port: 5432 } });
assert(Object.isFrozen(config), 'top level is frozen');
assert(Object.isFrozen(config.db), 'nested object is frozen too');
try { config.db.port = 9999; } catch (e) {}
assertEqual(config.db.port, 5432, 'nested mutation does not take effect');`,
  },

  {
    id: 'generic-group-by',
    title: 'Implement a generic groupBy',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['generics', 'inference'],
    prompt:
      "Implement `groupBy(items, keyFn)` that returns a `Record<K, T[]>` grouping the items by the key each one maps to. The generics should infer `T` from the array and `K` from the key function's return.",
    examples: [
      {
        input: "groupBy([1,2,3,4], n => n % 2 ? 'odd' : 'even')",
        output: "{ odd: [1, 3], even: [2, 4] }",
      },
    ],
    hints: [
      'Two type params: `T` (item) and `K extends string | number` (group key).',
      'Build the result with each key mapping to an array.',
      'Push each item into its group, creating the array on first sight.',
    ],
    starterCode: `function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  // your code here
}`,
    solution: `function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (out[key] ||= []).push(item);
  }
  return out;
}`,
    tests: `const grouped = groupBy([1, 2, 3, 4, 5, 6], (n) => (n % 2 === 0 ? 'even' : 'odd'));
assertEqual(grouped, { odd: [1, 3, 5], even: [2, 4, 6] }, 'groups by parity');`,
  },

  {
    id: 'typed-store',
    title: 'Build a typed state store',
    difficulty: 'Medium',
    language: 'typescript',
    tags: ['generics', 'patterns', 'pub-sub'],
    prompt:
      "Implement `createStore(initial)` returning a `Store<T>` with `get()`, `set(next)`, and `subscribe(fn)`. `set` updates the value and notifies every subscriber; `subscribe` returns an unsubscribe function.",
    examples: [
      {
        input: 'store.subscribe(fn); store.set(1)',
        output: 'fn is called with 1; store.get() === 1',
      },
    ],
    hints: [
      'Keep the value and a `Set` of subscriber functions in a closure.',
      '`set` assigns the new value, then calls every subscriber with it.',
      '`subscribe` adds the fn and returns `() => subs.delete(fn)`.',
    ],
    starterCode: `interface Store<T> {
  get(): T;
  set(next: T): void;
  subscribe(fn: (value: T) => void): () => void;
}

function createStore<T>(initial: T): Store<T> {
  // your code here
}`,
    solution: `interface Store<T> {
  get(): T;
  set(next: T): void;
  subscribe(fn: (value: T) => void): () => void;
}

function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const subs = new Set<(value: T) => void>();
  return {
    get: () => value,
    set: (next) => { value = next; subs.forEach((fn) => fn(value)); },
    subscribe: (fn) => { subs.add(fn); return () => subs.delete(fn); },
  };
}`,
    tests: `const store = createStore(0);
assertEqual(store.get(), 0, 'initial value');
const seen = [];
const unsub = store.subscribe((v) => seen.push(v));
store.set(1);
store.set(2);
assertEqual(store.get(), 2, 'set updates the value');
assertEqual(seen, [1, 2], 'subscribers are notified on each set');
unsub();
store.set(3);
assertEqual(seen, [1, 2], 'unsubscribe stops notifications');`,
  },
];
